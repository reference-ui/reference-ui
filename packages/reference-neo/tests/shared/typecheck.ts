// typecheck.ts — project type gate for agentneo run. Takes nothing, runs
// tsc --noEmit over the package, and emits the diagnostic lines (capped).
// run refuses when types are red: worlds and specs typecheck on every run,
// not just in the quality gate, so a broken fixture never reaches a browser.
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const NEO_DIR: string = path.dirname(path.dirname(HERE));
const MAX_LINES = 40;

export type TypecheckResult = { ok: true } | { ok: false; lines: string[] };

interface TscRun {
  code: number | null;
  text: string;
}

function runTsc(bin: string): Promise<TscRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, [bin, '--noEmit', '-p', NEO_DIR], { timeout: 180000 }, (err, stdout, stderr) => {
      if (err && (err.killed || (err as { code?: unknown }).code === 'ETIMEDOUT')) {
        resolve({ code: null, text: 'tsc timed out after 180s' });
        return;
      }
      resolve({ code: err ? (err as { code?: number }).code ?? 1 : 0, text: `${stdout}\n${stderr}` });
    });
  });
}

export async function checkTypes(): Promise<TypecheckResult> {
  let bin: string;
  try {
    // Resolve through package.json, not the bin subpath: the exports map
    // does not expose bin/tsc directly (same approach as the quality gate).
    const pkgFile = createRequire(import.meta.url).resolve('typescript/package.json');
    bin = path.join(path.dirname(pkgFile), 'bin', 'tsc');
  } catch {
    return { ok: false, lines: ['typescript not resolvable: cannot typecheck the package'] };
  }
  const run = await runTsc(bin);
  const lines = run.text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (run.code === 0 && lines.length === 0) return { ok: true };
  if (lines.length === 0) lines.push(`tsc exited ${String(run.code)} with no diagnostics`);
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return { ok: false, lines: shown };
}
