/*
JustRequest
v.1.0.0

Simple HTTP(s) package for Node.js.

by JustNode Dev Team / JustApple
*/

//https request in async/await
function request(method, url, headers = {}, body) {
	return new Promise((resolve, reject) => {
		//auto provide `Content-Length` header
		headers['Content-Length'] = headers['Content-Length'] ?? (body ? Buffer.byteLength(body) : 0);
		
		//make request
		https.request(url, {
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
		return this.body.toString(encoding);
	}
	
	//to json
	json(encoding) {
		try {
			return JSON.parse(this.body);
		} catch (err) {
			return undefined;
		}
	}
}

//export
module.exports = { request, generateMultipartBody, RequestResponse };