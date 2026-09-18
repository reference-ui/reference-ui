// Playground task harness: sync the playground project, then serve it.
// Takes an optional port and emits { url, close } once vite is listening.
// serve.mjs blocks on it for humans; capture.mjs drives it headless.
// Lives in tools/, so DIR climbs one level to the playground root it syncs
// and serves (pages, tokens, vite config, capture output all hang off DIR).
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const PORT = 5199;

export function listRoutes() {
  return fs
    .readdirSync(path.join(DIR, 'src', 'pages'))
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => name.slice(0, -'.tsx'.length))
    .sort();
}

// Sync starts by wiping .reference-ui/, so two concurrent boots corrupt each
// other silently. The lock fails loud instead; a dead holder's lock is stale
// (crashed mid-sync) and safe to steal.
async function withSyncLock(work) {
  const lock = path.join(DIR, '.sync.lock');
  let ours = null;
  try {
    ours = fs.openSync(lock, 'wx');
  } catch {
    const holder = Number(fs.readFileSync(lock, 'utf8'));
    let alive = Number.isInteger(holder);
    if (alive) {
      try {
        process.kill(holder, 0);
      } catch {
        alive = false;
      }
    }
    if (alive) throw new Error(`playground sync already running (pid ${holder}); wait for it to finish`);
    fs.unlinkSync(lock);
    ours = fs.openSync(lock, 'wx');
  }
  try {
    fs.writeSync(ours, String(process.pid));
    await work();
  } finally {
    fs.closeSync(ours);
    fs.unlinkSync(lock);
  }
}

export async function startPlayground({ port = PORT } = {}) {
  const { sync } = await import('../../src/sync/index.ts');
  await withSyncLock(() => sync(DIR));
  const server = await createServer({
    root: DIR,
    configFile: path.join(DIR, 'vite.config.ts'),
    server: { port, strictPort: true },
    logLevel: 'warn',
  });
  await server.listen();
  return {
    url: `http://localhost:${port}/`,
    close: () => server.close(),
  };
}
