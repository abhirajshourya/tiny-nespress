# tiny-nespress

A lightweight HTTP micro-framework built entirely on Node.js built-in modules (`http` and `fs`). Zero dependencies, minimal API, perfect for simple web servers and APIs.

## Features

- **Lightweight**: Built on Node's native `http` module only
- **Simple routing**: Easy-to-use route registration for all HTTP methods
- **Middleware support**: Register middleware that runs before route handlers
- **Response helpers**: Convenient methods for JSON responses and file serving
- **Minimal API**: Small surface area, easy to learn and understand

## Installation

```bash
npm install tiny-nespress
```

Requires Node.js 18+

## Quick Start

```javascript
const Nespress = require('tiny-nespress');

const app = new Nespress();

// Define a route
app.route('get', '/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## API

### Constructor

```javascript
const app = new Nespress();
```

Creates a new Nespress application instance with an underlying Node HTTP server.

### `app.route(method, path, handler)`

Registers a route handler.

**Parameters:**
- `method` (string): HTTP method in lowercase ('get', 'post', 'put', 'delete', etc.)
- `path` (string): Request path, e.g., '/api/users'
- `handler` (function): Route callback with signature `(req, res) => void`

**Example:**
```javascript
app.route('get', '/users', (req, res) => {
  res.json({ users: [] });
});

app.route('post', '/users', (req, res) => {
  res.status(201).json({ id: 1 });
});
```

### `app.beforeEach(fn)`

Registers a middleware function that runs before every route.

**Parameters:**
- `fn` (function): Middleware callback with signature `(req, res, next) => void`

Call `next()` to proceed to the next middleware or route handler.

**Example:**
```javascript
app.beforeEach((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### `app.listen(port, [callback])`

Starts the HTTP server.

**Parameters:**
- `port` (number): Port to listen on
- `callback` (function, optional): Called once the server is listening

**Example:**
```javascript
app.listen(3000, () => {
  console.log('Server ready!');
});
```

## Response Helpers

The response object includes these helper methods:

### `res.json(data)`

Sends a JSON response with `Content-Type: application/json`.

```javascript
res.json({ status: 'ok' });
```

### `res.status(code)`

Sets the HTTP status code and returns the response object for chaining.

```javascript
res.status(201).json({ created: true });
```

### `res.sendFile(path, [mime])`

Streams a file to the client.

**Parameters:**
- `path` (string): File path to serve
- `mime` (string, optional): MIME type for Content-Type header

```javascript
await res.sendFile('./public/index.html', 'text/html');
```

## Example Server

See [examples/server.js](examples/server.js) for a complete example with static file serving.

## License

MIT
