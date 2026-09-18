// build.ts — per-world source build for the neo harness. Takes a world dir
// and transpiles every src/**/*.ts(x) file into world/dist/ (gitignored).
// Worlds are TypeScript-only: the served tree is always derived by this step,
// never hand-written, so app sources and browser entries cannot drift.
import { transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

export const DIST_DIRNAME = 'dist';

type BuildResult = { files: string[] } | { error: string };

function messageOf(err: unknown): string {
  return err instanceof Error ? (err.message ?? String(err)) : String(err);
}

// All transpilable sources under the world src dir, recursive. Declaration
// files carry no runtime and never reach the browser, so they stay out.
function sourceFiles(srcDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if ((full.endsWith('.ts') || full.endsWith('.tsx')) && !full.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  };
  walk(srcDir);
  return out.sort();
}

// Transpile-only: imports are left untouched for browser import maps, and tsx
// compiles to classic createElement calls injected by banner so sources stay
// idiomatic JSX. Tsx sources must not import createElement or Fragment
// themselves; the banner owns those bindings. A case without src/ is a silent
// no-op; a syntax failure is a loud harness fault before any browser launches.
export async function buildWorld(worldDir: string): Promise<BuildResult> {
  const srcDir = path.join(worldDir, 'src');
  if (!fs.existsSync(srcDir)) return { files: [] };
  const distDir = path.join(worldDir, DIST_DIRNAME);
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  const files: string[] = [];
  for (const file of sourceFiles(srcDir)) {
    const rel = path.relative(worldDir, file);
    const outPath = path.join(distDir, rel.replace(/\.tsx?$/, '.js'));
    try {
      const code = fs.readFileSync(file, 'utf8');
      const isTsx = file.endsWith('.tsx');
      const result = await transform(code, {
        loader: isTsx ? 'tsx' : 'ts',
        format: 'esm',
        ...(isTsx
          ? {
              jsxFactory: 'createElement',
              jsxFragment: 'Fragment',
              banner: "import { createElement, Fragment } from '@reference-ui/react';",
            }
          : {}),
      });
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, result.code);
      files.push(outPath);
    } catch (err) {
      return { error: `world build failed for ${rel}: ${messageOf(err).split('\n')[0]}` };
    }
  }
  return { files };
}
