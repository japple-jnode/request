# `@jnode/request`

Simple HTTP(S) requesting package for Node.js.

## Installation

```
npm i @jnode/request
```

## Quick start

### Import

```js
const { request, FormPart } = require('@jnode/request');
```

### Make a request

```js
request('GET', 'https://example.com/').then((res) => {
  console.log(res.text());
});
```

### Make a `multipart/form-body` request

```js
request('POST', 'https://example.com/', [
  new FormPart('foo', 'bar'),
  new FormPart('awa', 'uwu')
]).then((res) => {
  console.log(res.text());
});
```

--------

# Reference

## `request.request(method, url[, body, headers, options])`

- `method` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) A string specifying the HTTP request method. **Default:** `'GET'`.
- `url` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) | [\<URL\>](https://nodejs.org/docs/latest/api/url.html#the-whatwg-url-api) The target URL to request, support both `http` and `https`.
- `body` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) | [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer) | [\<Uint8Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [\<stream.Readable\>](https://nodejs.org/docs/latest/api/stream.html#class-streamreadable) | [\<URLSearchParams\>](https://nodejs.org/docs/latest/api/url.html#class-urlsearchparams) | [\<request.FormPart[]\>](#class-requestformpart) | [\<Object[]\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) The request body. Using [\<URLSearchParams\>](https://nodejs.org/docs/latest/api/url.html#class-urlsearchparams) will send a `application/x-www-form-urlencoded` request; using [\<request.FormPart[]\>](#class-requestformpart) or  [\<Object[]\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) will send a `multipart/form-body` request.
- `headers` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) An object containing request headers. `Content-Length` is automatically calculated for [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type), [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer), [\<Uint8Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array), or [\<URLSearchParams\>](https://nodejs.org/docs/latest/api/url.html#class-urlsearchparams) body. And `Content-Type` will be force replaced while sending a `multipart/form-body` request with  [\<FormPart[]\>](#class-requestformpart) or [\<Object[]\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) body.
- `options` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) `options` in [`http.request()`](https://nodejs.org/docs/latest/api/http.html#httprequestoptions-callback).
- Returns: [\<request.RequestResponse\>](#class-requestrequestresponse)

Make a HTTP(S) request.

## Class: `request.FormPart`

### `new request.FormPart(name, body[, headers])`

- `name` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Name of the part.
- `body` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) | [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer) | [\<Uint8Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [\<stream.Readable\>](https://nodejs.org/docs/latest/api/stream.html#class-streamreadable) | [\<URLSearchParams\>](https://nodejs.org/docs/latest/api/url.html#class-urlsearchparams) The body of the part. Using [\<URLSearchParams\>](https://nodejs.org/docs/latest/api/url.html#class-urlsearchparams) will create a `application/x-www-form-urlencoded` part.
- `headers` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) An object containing part headers. There is a special `filename` field, will be added to `Content-Disposition`.

## Class: `request.RequestResponse`

### `new request.RequestResponse(res)`

- `res` [\<http.IncomingMessage\>](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage) The original `node:http` response object.

### `requestResponse.res`

- Type: [\<http.IncomingMessage\>](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage)

### `requestResponse.statusCode`

- Type: [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type)

The response HTTP status code.

### `requestResponse.headers`

- Type: [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The response HTTP headers.

### `requestResponse._body`

- Type: [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer)

> **Notice**: You should avoid reading this property directly, use [`requestRespond.buffer()`](#requestrespondbuffer) instead.

### `requestResponse.buffer()`

- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Fulfills with a [\<Buffer\>](https://nodejs.org/docs/latest/api/buffer.html#class-buffer) object.

Receives the body of the response stream and return as a buffer.

### `requestResponse.text([encoding])`

- `encoding` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The character encoding to use. **Default:** `'utf8'`.
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Fulfills with a string.

Receives the body of the response stream and return as a string.

### `requestResponse.json([encoding])`

- `encoding` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The character encoding to use. **Default:** `'utf8'`.
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Fulfills with any of [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object), [\<Array\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type), [\<number\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type), [\<boolean\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#boolean_type), or [\<null\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#null_type).

Receives the body of the response stream and parse string as JSON.

### `requestResponse.rl()`

- Returns: [\<readline.Interface\>](https://nodejs.org/docs/latest/api/readline.html#class-readlineinterface)

Provides an interface for reading data from response one line at a time.

### `requestResponse.sse()`

- Returns: [\<request.EventReceiver\>](#class-requesteventreceiver)

Provides an interface for reading data from response as Server-Sent Events (SSE, `text/event-stream`).

## Class: `request.EventReceiver`

- Extends: [\<EventEmitter\>](https://nodejs.org/docs/latest/api/events.html#class-eventemitter)

An interface for reading data from [\<stream.Readable\>](https://nodejs.org/docs/latest/api/stream.html#class-streamreadable) as Server-Sent Events (SSE, `text/event-stream`).

### `new request.EventReceiver(res)`

- `res` [\<stream.Readable\>](https://nodejs.org/docs/latest/api/stream.html#class-streamreadable) The response stream or any readable stream.

### Event: `'close'`

Emitted when the request has been completed.

### Event: `'event'`

- `event` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `data` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The full data string of this event.
  - `event` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The event name.
  - `id` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) The event id.

### `eventReceiver.res`

- Type: [\<stream.Readable\>](https://nodejs.org/docs/latest/api/stream.html#class-streamreadable)

The response stream or any readable stream.

### `eventReceiver.rl`

- Type: [\<readline.Interface\>](https://nodejs.org/docs/latest/api/readline.html#class-readlineinterface)

An interface for reading data from response one line at a time.
