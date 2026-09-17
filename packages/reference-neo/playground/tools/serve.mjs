#!/usr/bin/env node
// Playground interactive server: sync fresh, then serve until killed.
// Usage: pnpm playground — then open the printed URL in a browser.
import { listRoutes, startPlayground } from './lib.mjs';

const { url } = await startPlayground({});
console.log(`playground: ${url}  (routes: ${listRoutes().map((r) => `#/${r}`).join(' ')})`);
console.log('playground: serving until killed (Ctrl-C).');
await new Promise(() => {});
