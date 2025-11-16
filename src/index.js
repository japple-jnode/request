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
		if (typeof body === 'string' || Buffer.isBuffer(body) || body instanceof Uint8Array) { // static body
			req.setHeader('Content-Length', Buffer.byteLength(body));
			req.end(body);
		} else if (body instanceof stream.Readable) { // stream
			body.pipe(req);
		} else if (Array.isArray(body)) { // multipart/form-body
			// generate boundary
			const boundary = `----WebKitFormBoundary${Date.now().toString(16)}${crypto.randomUUID()}`;
			req.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);

			// write every parts
			for (const part of body) {
				req.write(`--${boundary}\r\n`); // boundary

				// part headers
				const partHeaders = part.headers || {};

				// set Content-Disposition header
				if (!partHeaders['Content-Disposition']) {
					partHeaders['Content-Disposition'] = `form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ''}`;
				}

				// write headers and body
				if (typeof part.body === 'string' || Buffer.isBuffer(part.body) || part.body instanceof Uint8Array) { // static body
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
	constructor(name = '', body, headers = {}) {
		this.name = name;
		this.body = body;
		this.headers = headers;
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
		return new Promise((resolve, reject) => {
			if (!this._body) {
				const chunks = [];
				this.res.on('data', (d) => { chunks.push(d); });
				this.res.on('end', () => {
					this._body = Buffer.concat(chunks);
					resolve(Buffer.concat(chunks));
				});
				this.res.on('error', reject);
			} else {
				resolve(this._body);
			}
		});
	}

	async text(encoding = 'utf8') {
		return (await this.buffer()).toString(encoding);
	}

	async json(encoding = 'utf8') {
		return JSON.parse((await this.text(encoding)));
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
	}
}

// export
module.exports = { request, FormPart, RequestResponse };