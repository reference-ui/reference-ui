/**
 * Target discovery for the Neo quality gate: it turns argv paths, or the default Neo roots, into the code and
 * README files to inspect, skipping gitignored build output and the generated lib mirror. It reads directory
 * entries and file names only, so the tiers that follow can trust the list they are given.
 */
import type { Stats } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
export const NEO_DIR: string = path.dirname(path.dirname(HERE));
// Gitignored generated lib mirror (provenance headers from the checked-in mirror tool); the gate never judges it.
const MIRROR_DIR: string = path.join(NEO_DIR, 'src', 'reference', 'browser-component');
// Gitignored build output (a case world's .reference-ui, dist builds, installed node_modules, Playwright reports). Never hand-written, so the walk never enters them.
const GENERATED_DIRS: Set<string> = new Set(['.reference-ui', 'dist', 'node_modules', 'test-results', 'playwright-report', 'blob-report']);
const CODE_EXTS: Set<string> = new Set(['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);

async function defaultTargets(): Promise<string[]> {
  const roots = ['src', 'tests/shared', 'tools/quality', 'bin'].map((p) => path.join(NEO_DIR, p));
  try {
    const casesDir = path.join(NEO_DIR, 'tests/cases');
    for (const kid of await readdir(casesDir)) {
      const specs = path.join(casesDir, kid, 'specs');
      try { await stat(specs); roots.push(specs); } catch { /* case without specs */ }
    }
  } catch { /* no cases dir yet */ }
  return roots;
}

export async function resolveTargets(paths: string[]): Promise<string[]> {
  const targets = paths.length ? paths : await defaultTargets();
  const existing: string[] = [];
  for (const t of targets) {
    try {
      await stat(t);
      existing.push(t);
    } catch {
      console.log(`[neo-quality] skipping missing path: ${t}`);
    }
  }
  return existing;
}

async function walk(entry: string, code: Set<string>, readmes: Set<string>): Promise<void> {
  const resolved = path.resolve(entry);
  if (resolved === MIRROR_DIR || resolved.startsWith(MIRROR_DIR + path.sep)) return;
  let s: Stats;
  try {
    s = await stat(entry);
  } catch {
    return;
  }
  if (!s.isDirectory()) {
    const resolved = path.resolve(entry);
    if (path.basename(entry).toLowerCase() === 'readme.md') readmes.add(resolved);
    else if (CODE_EXTS.has(path.extname(entry).toLowerCase())) code.add(resolved);
    return;
  }
  if (GENERATED_DIRS.has(path.basename(entry))) return;
  for (const kid of await readdir(entry)) await walk(path.join(entry, kid), code, readmes);
}

export async function collect(targets: string[]): Promise<{ code: string[]; readmes: string[] }> {
  const code = new Set<string>();
  const readmes = new Set<string>();
  for (const target of targets) await walk(target, code, readmes);
  return { code: [...code].sort(), readmes: [...readmes].sort() };
}

export function isGenerated(file: string, text: string | null | undefined): boolean {
  if (file.includes('.gen.')) return true;
  return (text ?? '').split('\n', 12).some((line) => line.includes('@generated'));
}
