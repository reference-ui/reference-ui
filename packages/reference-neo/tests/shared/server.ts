// server.ts — one-case static file server for the neo harness. Takes a world
// directory root plus optional { host, port } (defaults: 127.0.0.1, ephemeral).
// Emits a promise resolving to { host, port, url, stop } once the local HTTP
// server is listening, so headless browsers can load worlds file servers block.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json; charset=utf-8',
};

export interface ServerOptions {
  host?: string;
  port?: number;
}

export interface ServedWorld {
  host: string;
  port: number;
  url: string;
  stop: () => Promise<void>;
}

// One-case static server. The MCP browser blocks file:// URLs, so every
// case world is served over local HTTP on 127.0.0.1 with an ephemeral port.
export function startServer(root: string, { host = '127.0.0.1', port = 0 }: ServerOptions = {}): Promise<ServedWorld> {
  const base = path.resolve(root);
  if (!fs.existsSync(base) || !fs.statSync(base).isDirectory()) {
    throw new Error(`world dir not found: ${base}`);
  }
  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
      const rel = path.normalize(pathname).replace(/^[/\\]+/, '');
      let file = path.join(base, rel);
      if (!file.startsWith(base)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500);
      res.end('error');
    }
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({
        host,
        port: actualPort,
        url: `http://${host}:${actualPort}/`,
        stop: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
