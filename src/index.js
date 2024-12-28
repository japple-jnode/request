/*
JustRequest
v.1.1.0

Simple HTTP(s) package for Node.js.

by JustNode Dev Team / JustApple
*/

//load node packages
const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL } = require('url');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');

//https request in async/await
function request(method, url, headers = {}, body) {
	return new Promise((resolve, reject) => {
		//auto provide `Content-Length` header
		headers['Content-Length'] = headers['Content-Length'] ?? (body ? Buffer.byteLength(body) : 0);
		
		//support http and https
		const protocol = url.startsWith('https://') ? https : http;
		
		//make request
		protocol.request(url, {
			method: method,
			headers: headers
		}, (res) => {
			let chunks = [];
			res.on('data', (chunk) => chunks.push(chunk));
			res.on('end', () => {
				resolve(new RequestResponse(res, Buffer.concat(chunks)));
			});
			res.on('error', reject);
		}).end(body).on('error', reject);
	});
}

//generate `multipart/form-data` type request body
function generateMultipartBody(parts = []) {
	//we use `----JustNodeFormBoundary` as boundary, and will encode data with base64
	//every part of `parts` is an object with item `disposition`, `contentType` and `data` (Buffer)
	
	let result = '';
	for (let i of parts) { //add every part
		result += '------JustNodeFormBoundary\r\n' +
		'Content-Disposition: form-data' + (i.disposition ? '; ' + i.disposition : '') + '\r\n' +
		'Content-Type: ' + (i.contentType ?? 'application/octet-stream') + '\r\n' +
		'Content-Transfer-Encoding: base64\r\n\r\n' +
		(i.encoded ?? ((typeof i.data === 'string') ? Buffer.from(i.data) : i.data).toString('base64')) + '\r\n';
	}
	result += '------JustNodeFormBoundary--'; //end
	
	return result;
}

//http multipart/form-data request
async function multipartRequest(method, url, headers, parts, options) {
	return new Promise(async (resolve, reject) => {
		const parsedUrl = new URL(url); //parse url
		const isHttps = parsedUrl.protocol === 'https:'; //check protocol
		const reqModule = isHttps ? https : http; //select module from http and https
		
		const boundary = `----WebKitFormBoundary${Date.now().toString(16)}${crypto.randomUUID()}`; //create a random boundary
		headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`; //set header
		
		//set options
		options = {
			method,
			headers,
			...options
		};
		
		//make a request
		const req = reqModule.request(url, options, (res) => {
			//save buffers
			let chunks = [];
			res.on('data', (chunk) => chunks.push(chunk));
			
			res.on('end', () => {
				resolve(new RequestResponse(res, Buffer.concat(chunks)));
			});
			
			res.on('error', (err) => {
				reject(err);
			});
		});
		
		req.on('error', (err) => {
			reject(err);
		});
		
		//send every parts
		for (const part of parts) {
			req.write(`--${boundary}\r\n`); //write boundary
			
			//write disposition
			if (part.disposition) {
				req.write(`Content-Disposition: ${part.disposition}\r\n`);
			}
			
			//write content type
			let contentType = part.type ?? 'application/octet-stream';
			req.write(`Content-Type: ${contentType}\r\n`);
			
			//send data
			if (part.file) { //local file, using streams
				req.write('\r\n');
				const fileStream = fs.createReadStream(part.file);
				await pipeline(fileStream, req, { end: false }); //pipe stream but not end
				req.write('\r\n');
			} else if (part.data) { //string or buffer data
				req.write('\r\n');
				req.write(part.data + '\r\n');
			} else if (part.base64) { //base64 data
				req.write('Content-Transfer-Encoding: base64\r\n\r\n'); //using base64 encoding
				req.write(part.base64 + '\r\n');
			} else if (part.stream) { //any readable stream
				req.write('\r\n');
				await pipeline(part.stream, req, { end: false });
				req.write('\r\n');
			}
		}
		
		//end request
		req.write(`--${boundary}--\r\n`);
		req.end();
	});
}

//request response
class RequestResponse {
	constructor(res, body) {
		this.res = res;
		this.body = body;
		
		this.statusCode = res.statusCode;
		this.headers = res.headers;
	}
	
	//to string
	text(encoding) {
		return this._text ?? (this._text = this.body.toString(encoding));
	}
	
	//to json
	json(encoding) {
		try {
			return this._json ?? (this._json = JSON.parse(this.body));
		} catch (err) {
			return undefined;
		}
	}
}

//export
module.exports = { request, multipartRequest, generateMultipartBody, RequestResponse };