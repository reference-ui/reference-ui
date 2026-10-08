// server.ts — one-case static file server for the neo harness. Takes a world
// directory root plus optional { host, port } (defaults: 127.0.0.1, ephemeral).
// Emits a promise resolving to { host, port, url, stop } once the local HTTP
// server is listening, so headless browsers can load worlds file servers block.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { getVendorReactCode } from './vendor-react.ts';

const VENDOR_ROUTE = '/__neo__/react.mjs';
const IMPORTMAP_OPEN = '<script type="importmap">';

// Map the external react specifiers onto the harness vendor bundle. Worlds
// declare only @reference-ui/react; the generated entry's bare 'react' and
// 'react-dom/client' imports would otherwise 404 in a raw browser. Skips
// worlds that already map react themselves, and never double-inserts.
function injectVendorMap(html: string): string {
  const start = html.indexOf(IMPORTMAP_OPEN);
  if (start < 0) return html;
  const end = html.indexOf('</script>', start);
  if (end < 0) return html;
  const block = html.slice(start, end);
  if (block.includes(VENDOR_ROUTE) || /"react"\s*:/.test(block)) return html;
  const importsAt = block.indexOf('"imports"');
  if (importsAt < 0) return html;
  const open = block.indexOf('{', importsAt);
  if (open < 0) return html;
  const insert = `"react": "${VENDOR_ROUTE}", "react-dom/client": "${VENDOR_ROUTE}", `;
  const at = start + open + 1;
  return html.slice(0, at) + insert + html.slice(at);
}

function serveVendor(res: http.ServerResponse): void {
  getVendorReactCode().then(
    (code) => {
      res.writeHead(200, { 'content-type': MIME['.mjs'] ?? 'application/octet-stream' });
      res.end(code);
    },
    () => {
      res.writeHead(500);
      res.end('error');
    },
  );
}

function requestPathname(req: http.IncomingMessage): string {
  return decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
}

type ResolvedWorldFile = { file: string } | { status: 403 } | { status: 404 };

function resolveWorldFile(base: string, pathname: string): ResolvedWorldFile {
  const rel = path.normalize(pathname).replace(/^[/\\]+/, '');
  let file = path.join(base, rel);
  if (!file.startsWith(base)) return { status: 403 };
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return { status: 404 };
  return { file };
}

function serveWorldFile(res: http.ServerResponse, file: string): void {
  const mime = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': mime });
  if (mime.startsWith('text/html')) {
    res.end(injectVendorMap(fs.readFileSync(file, 'utf8')));
    return;
  }
  fs.createReadStream(file).pipe(res);
}

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
      const pathname = requestPathname(req);
      if (pathname === VENDOR_ROUTE) {
        serveVendor(res);
        return;
      }
      const resolved = resolveWorldFile(base, pathname);
      if (!('file' in resolved)) {
        res.writeHead(resolved.status);
        res.end(resolved.status === 403 ? 'forbidden' : 'not found');
        return;
      }
      serveWorldFile(res, resolved.file);
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
