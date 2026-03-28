/*
JustRequest
v2

Simple HTTP(s) requesting package for Node.js.

by JustApple
*/

// dependencies
const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL, URLSearchParams } = require('url');
const stream = require('stream');
const crypto = require('crypto');
const readline = require('readline');
const EventEmitter = require('events');

// make a HTTP(S) request
function request(method = 'GET', url = '', body, headers = {}, options = {}) {
	return new Promise(async (resolve, reject) => {
		// protocol select
		if (typeof url === 'string') url = new URL(url);
		const protocol = url.protocol === 'https:' ? https : http;

		// make request
		const req = protocol.request(url, { method, headers }, (res) => {
			resolve(new RequestResponse(res));
		});

		// write headers and body
		if (typeof body === 'string' || body instanceof Uint8Array) { // static body
			req.setHeader('Content-Length', Buffer.byteLength(body));
			req.end(body);
		} else if (body instanceof stream.Readable) { // stream
			body.pipe(req);
		} else if (Array.isArray(body)) { // multipart/form-body
			// generate boundary
			const boundary = `----WebKitFormBoundary${Date.now().toString(16)}${crypto.randomUUID()}`;
			req.setHeader('Content-Type', `multipart/${options.multipart || 'form-data'}; boundary=${boundary}`);

			// write every parts
			for (const part of body) {
				req.write(`--${boundary}\r\n`); // boundary

				// part headers
				const partHeaders = part.headers || {};

				// set Content-Disposition header
				if (!req.getHeader('content-disposition') && (part.name || part.filename || part.disposition)) {
					part.filename = part.filename ? encodeURIComponent(part.filename) : part.filename;
					partHeaders['Content-Disposition'] = (part.disposition || 'form-data') +
						(part.name ? `; name="${part.name}"` : '') +
						(part.filename ? `; filename="${part.filename}"; filename*=UTF-8''${part.filename}` : '');
				}

				// write headers and body
				if (typeof part.body === 'string' || part.body instanceof Uint8Array) { // static body
					for (const [key, value] of Object.entries(partHeaders)) {
						req.write(`${key}: ${value}\r\n`);
					}
					req.write('\r\n');

					req.write(part.body);
					req.write('\r\n');
				} else if (part.body instanceof stream.Readable) { // stream body
					for (const [key, value] of Object.entries(partHeaders)) {
						req.write(`${key}: ${value}\r\n`);
					}
					req.write('\r\n');

					await new Promise((res, rej) => {
						part.body.on('error', rej);
						part.body.on('end', res);
						part.body.pipe(req, { end: false });
					});
					req.write('\r\n');
				} else if (part.body instanceof URLSearchParams) {
					const encoded = part.body.toString();
					partHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
					for (const [key, value] of Object.entries(partHeaders)) {
						req.write(`${key}: ${value}\r\n`);
					}
					req.write('\r\n');

					req.write(encoded);
					req.write('\r\n');
				} else { // no body
					for (const [key, value] of Object.entries(partHeaders)) {
						req.write(`${key}: ${value}\r\n`);
					}
					req.write('\r\n\r\n');
				}
			}

			// end multipart body
			req.write(`--${boundary}--`);
			req.end();
		} else if (body instanceof URLSearchParams) { // application/x-www-form-urlencoded
			const encoded = body.toString();
			req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
			req.setHeader('Content-Length', Buffer.byteLength(encoded));
			req.end(encoded);
		} else { // no body
			req.end();
		}
	});
}

// form part
class FormPart {
	constructor(name = '', body, headers = {}, options = {}) {
		this.name = name;
		this.body = body;
		this.headers = headers;
		this.filename = options.filename;
		this.disposition = options.disposition;
	}
}

//request response
class RequestResponse {
	constructor(res) {
		this.res = res;

		this.statusCode = res.statusCode;
		this.headers = res.headers;
	}

	buffer() {
		if (this._body) return this._body;
		return new Promise((resolve, reject) => {
			const chunks = [];
			this.res.on('data', (d) => { chunks.push(d); });
			this.res.on('end', () => {
				this._body = Buffer.concat(chunks);
				resolve(Buffer.concat(chunks));
			});
			this.res.on('error', reject);
		});
	}

	async text(encoding = 'utf8') {
		return this['_text_' + encoding] ?? (this['_text_' + encoding] = (await this.buffer()).toString(encoding));
	}

	async json(encoding = 'utf8') {
		return this['_json_' + encoding] ?? (this['_json_' + encoding] = JSON.parse(await this.text(encoding)));
	}

	rl() {
		return readline.createInterface({
			input: this.res,
			crlfDelay: Infinity
		});
	}

	sse() {
		return new EventReceiver(this.res);
	}
}

// SSE (text/event-stream) event receiver
class EventReceiver extends EventEmitter {
	constructor(res) {
		super();
		this.res = res;
		this.rl = readline.createInterface({
			input: res,
			crlfDelay: Infinity
		});

		let name = 'message';
		let data = '';
		let id = null;

		this.rl.on('line', (line) => {
			// comment
			if (line.startsWith(':')) return;

			// fields
			if (line.startsWith('event: ')) name = line.slice(7);
			else if (line.startsWith('event:')) name = line.slice(6);
			else if (line.startsWith('data: ')) data += line.slice(6) + '\n';
			else if (line.startsWith('data:')) data += line.slice(5) + '\n';
			else if (line.startsWith('id: ')) id = line.slice(4).trim();
			else if (line.startsWith('id:')) id = line.slice(3).trim();
			else if (line === '') { // event finished
				if (data.endsWith('\n')) data = data.slice(0, -1); // remove last \n
				this.emit('event', { name, data, id });

				// reset
				name = 'message';
				data = '';
				id = null;
			}
		});

		this.rl.on('close', () => { this.emit('close'); });
		this.rl.on('error', (err) => {
			this.emit('error', err);
			this.emit('close');
		});
	}

	// async generator support
	[Symbol.asyncIterator]() {
		let queue = [];
		let done = false;
		let resolvers = [];

		// event
		const onEvent = (event) => {
			if (resolvers.length > 0) {
				resolvers.shift()({ value: event, done: false });
			} else {
				queue.push(event);
			}
		};
		this.on('event', onEvent);

		// close (including error)
		const onClose = () => {
			done = true;
			while (resolvers.length > 0) {
				resolvers.shift()({ done: true });
			}
		};
		this.on('close', onClose);

		return {
			next: () => {
				return new Promise((resolve, reject) => {
					if (queue.length > 0) {
						resolve({ value: queue.shift(), done: false });
					} else if (done) {
						resolve({ done: true });
					} else {
						resolvers.push(resolve);
					}
				});
			},
			return: () => {
				done = true;
				while (resolvers.length > 0) {
					resolvers.shift()({ done: true });
				}
				this.off('event', onEvent);
				this.off('close', onClose);
			},
			[Symbol.asyncIterator]() { return this; }
		}
	}
}

// export
module.exports = { request, FormPart, RequestResponse };