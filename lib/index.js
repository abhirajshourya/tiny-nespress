// Lightweight HTTP micro-framework built on Node's built-in modules.
// Usage:
//   const Nespress = require('nespress');
//   const app = new Nespress();
//   app.route('get', '/', (req, res) => res.json({ ok: true }));
//   app.listen(3000, () => console.log('Server running'));

const http = require('node:http');
const fs = require('node:fs/promises');

class Nespress {
  constructor() {
    // Underlying Node HTTP server.
    this.server = http.createServer();

    // Route table:
    //   this.routes['get /'] = (req, res) => { ... }
    this.routes = {};

    // Middleware stack:
    //   each fn has signature (req, res, next) => void
    this.middleware = [];

    // Handle every incoming request.
    this.server.on('request', (req, res) => {
      // Response helper: stream a file to the client.
      res.sendFile = async (path, mime) => {
        const fileHandle = await fs.open(path, 'r');
        const fileStream = fileHandle.createReadStream();
        if (mime) {
          res.setHeader('Content-Type', mime);
        }
        fileStream.pipe(res);
      };

      // Response helper: set status code and allow chaining.
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      // Response helper: send JSON payload.
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      // Run all middleware in sequence, then the matching route handler.
      const runMiddleware = (index) => {
        // Once all middleware is done, try to resolve the route.
        if (index === this.middleware.length) {
          const key = req.method.toLowerCase() + ' ' + req.url;
          const handler = this.routes[key];

          if (!handler) {
            return res
              .status(404)
              .json({ error: `Cannot ${req.method} ${req.url}` });
          }

          return handler(req, res);
        }

        // Invoke middleware[index], passing a next() function.
        this.middleware[index](req, res, () => runMiddleware(index + 1));
      };

      runMiddleware(0);
    });
  }

  /**
   * Register a route handler.
   * @param {'get'|'post'|'put'|'delete'|string} method - HTTP method (lowercase).
   * @param {string} path - Request path, e.g. '/api/users'.
   * @param {(req, res) => void} handler - Route callback.
   */
  route(method, path, handler) {
    const key = method.toLowerCase() + ' ' + path;
    this.routes[key] = handler;
  }

  /**
   * Register a middleware function that runs before every route.
   * @param {(req, res, next: () => void) => void} fn - Middleware callback.
   */
  beforeEach(fn) {
    this.middleware.push(fn);
  }

  /**
   * Start the HTTP server.
   * @param {number} port - Port to listen on.
   * @param {() => void} [callback] - Called once the server is listening.
   */
  listen(port, callback = () => {}) {
    this.server.listen(port, callback);
  }
}

module.exports = Nespress;
