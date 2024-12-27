# JustRequest

Simple HTTP(s) package for Node.js.

## Installation

```shell
npm install @jnode/request
```

## Usage

### Import JustRequest

```javascript
const { request, multipartRequest, generateMultipartBody, RequestResponse } = require('@jnode/request');
```

### Making a request

```javascript
async function fetchData() {
  try {
    const response = await request('GET', 'https://example.com/api/data');
    console.log('Status Code:', response.statusCode);
    console.log('Body:', response.text()); // Use response.json() if expecting a JSON response
  } catch (error) {
    console.error('Request failed:', error);
  }
}

fetchData();
```

### Sending data with the request

```javascript
async function postData() {
  try {
      const headers = {
        'Content-Type': 'application/json'
      };
      const body = JSON.stringify({ key: 'value' });
      const response = await request('POST', 'https://example.com/api/post', headers, body);
      console.log('Status Code:', response.statusCode);
      console.log('Response:', response.text());
  } catch (error) {
      console.error('Request failed:', error);
  }
}

postData();
```

### Generating a `multipart/form-data` body

```javascript
const fs = require('fs');

async function uploadFile() {
  const fileData = await fs.promises.readFile('./example.txt');
  const parts = [{
    disposition: 'form-data; name="file"; filename="example.txt"',
    contentType: 'text/plain',
    data: fileData
  }, {
      disposition: 'form-data; name="key"',
      data: 'value'
  }];
  const body = generateMultipartBody(parts);
  
  const headers = {
    'Content-Type': 'multipart/form-data; boundary=----JustNodeFormBoundary'
  };

  try {
      const response = await request('POST', 'https://example.com/api/upload', headers, body);
      console.log('Status Code:', response.statusCode);
      console.log('Response:', response.text());
  } catch (error) {
      console.error('Request failed:', error);
  }
}

uploadFile();
```

### Making a multipart request
```javascript
const fs = require('fs');

async function uploadFile() {
  const fileStream = fs.createReadStream('./example.txt');
  const parts = [{
    disposition: 'form-data; name="file"; filename="example.txt"',
    stream: fileStream
  }, {
      disposition: 'form-data; name="key"',
      data: 'value'
  }];
  
  const headers = {
    'X-Custom-Header': 'custom value'
  };
  try {
      const response = await multipartRequest('POST', 'https://example.com/api/upload', headers, parts);
      console.log('Status Code:', response.statusCode);
      console.log('Response:', response.text());
  } catch (error) {
      console.error('Request failed:', error);
  }
}

uploadFile();
```

## Functions

### `request(method, url, headers = {}, body)`

Makes an HTTP(S) request.

-   `method`: HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.).
-   `url`: The request URL.
-   `headers`: An object containing request headers. Defaults to an empty object.
-   `body`: The request body (string or Buffer).

**Returns:** A Promise that resolves to a `RequestResponse` object.

### `multipartRequest(method, url, headers, parts, options)`

Makes an HTTP(S) multipart/form-data request.

-  `method`: HTTP method (`POST`, `PUT`, etc.).
-  `url`: The request URL.
-  `headers`: An object containing request headers.
-  `parts`: An array of objects, where each object represents a part of the form data.
    - `disposition` (Optional): Content disposition.
    - `type` (Optional): Content type of the data. Defaults to `application/octet-stream`.
    - `data`: Data (string or Buffer) of this part.
    - `file` (Optional): Path to a local file for streaming.
    - `base64` (Optional): base64 encoded data string.
    - `stream` (Optional): Any readable stream.
- `options`: Other options.

**Returns:** A Promise that resolves to a `RequestResponse` object.

### `generateMultipartBody(parts = [])`

Generates the body for a `multipart/form-data` request.

-   `parts`: An array of objects, where each object represents a part of the form data.
    -   `disposition` (Optional): Content disposition.
    -   `contentType` (Optional): Content type of the data. Defaults to `application/octet-stream`.
    -   `data`: Data (string or Buffer) of this part.
    -    `encoded` (Optional): If provided, the data is already base64 encoded, you may skip the default base64 encoding.

**Returns:** A string representing the multipart body.

## Class `RequestResponse`

A class representing the response from an HTTP(S) request.

### Properties

-   `statusCode`: The HTTP status code of the response.
-   `headers`: An object containing the response headers.
-   `body`: The raw response body (Buffer).

### Methods

-   `text(encoding = 'utf8')`: Returns the response body as a string with optional encoding.
-   `json()`: Attempts to parse the response body as JSON. Returns a JSON object or `undefined` if parsing fails.