// deep-world.ts — the temp world both CORE-BOUND-05 specs sync. It is a helper, not a spec: the runner picks up only *.spec.ts
// files. buildDeepWorld copies the committed world into a temp directory the calling spec owns, writes 70 small styled files
// and one src/deep.ts whose css value nests `levels` parentheses deep, and returns the directory. The caller removes it in a finally.
import { cpSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORLD_DIR = fileURLToPath(new URL('../world', import.meta.url));
export const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
export const SYNC_BUDGET_MS = 10_000;
const SMALL_FILES = 70;

// The deep file: its css value is `levels` parentheses deep, on line 3, after the import and a blank line.
function deepSource(levels: number): string {
  const open = '('.repeat(levels);
  const close = ')'.repeat(levels);
  return `import { css } from '@reference-ui/react'\n\nexport const deep = css({ color: ${open}'red'${close} })\n`;
}

function smallSource(index: number): string {
  return `import { css } from '@reference-ui/react'\n\nexport const p${index} = css({ color: 'blue' })\n`;
}

// A fresh copy of the committed world, under its real path so the sync resolves the same root.
export function buildDeepWorld(levels: number): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-05-')));
  cpSync(WORLD_DIR, dir, { recursive: true });
  const src = path.join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(path.join(src, 'deep.ts'), deepSource(levels), 'utf8');
  for (let i = 0; i < SMALL_FILES; i++) {
    writeFileSync(path.join(src, `p${i}.ts`), smallSource(i), 'utf8');
  }
  return dir;
}
