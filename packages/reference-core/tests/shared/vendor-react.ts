// vendor-react.ts — browser-loadable React for case worlds. Takes nothing and
// emits one ESM bundle: react plus react-dom/client over the pinned
// production builds. The generated react.mjs imports react externally, which
// raw-browser worlds cannot resolve, so the harness serves this vendor file at
// a virtual route and maps both specifiers to it (see server.ts). Worlds keep
// one shared React copy, exactly like a real consumer's bundler provides.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

function productionBuild(packageName: string, file: string): string {
  return join(dirname(require.resolve(`${packageName}/package.json`)), 'cjs', file);
}

// Explicit names: esbuild drops `export *` over CJS (the star side lexes to
// nothing), so the entry names every export of the installed react instead.
// Keys come from the real package, so upgrades stay in sync or fail loudly.
function vendorEntry(): string {
  const names = Object.keys(require('react') as Record<string, unknown>).sort();
  if (!names.includes('createElement')) throw new Error('vendor react entry found no react exports');
  return [
    `export { ${names.join(', ')} } from 'react';`,
    "export { createRoot, hydrateRoot } from 'react-dom/client';",
    '',
  ].join('\n');
}

let cached: Promise<string> | undefined;

// Build the vendor bundle once per process. Pinned CJS inputs plus a fixed
// entry keep the bytes deterministic across cases and runs.
export function getVendorReactCode(): Promise<string> {
  if (!cached) {
    cached = build({
      stdin: { contents: vendorEntry(), resolveDir: here, loader: 'js' },
      alias: {
        react: productionBuild('react', 'react.production.js'),
        'react-dom': productionBuild('react-dom', 'react-dom.production.js'),
        'react-dom/client': productionBuild('react-dom', 'react-dom-client.production.js'),
        scheduler: productionBuild('scheduler', 'scheduler.production.js'),
      },
      define: { 'process.env.NODE_ENV': '"production"' },
      bundle: true,
      format: 'esm',
      platform: 'browser',
      minify: false,
      write: false,
      banner: { js: '// Neo harness vendor React: pinned production builds, one shared copy.' },
    }).then((result) => {
      const out = result.outputFiles?.[0]?.text;
      if (!out) throw new Error('vendor react build produced no output');
      return out;
    });
  }
  return cached;
}
