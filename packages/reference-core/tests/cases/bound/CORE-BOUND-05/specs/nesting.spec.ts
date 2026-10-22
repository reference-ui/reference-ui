// nesting.spec.ts — spec for CORE-BOUND-05, a real ref sync of 71 files with one 2,000-deep value.
// It takes { case } from the runner and builds a temp copy of the committed world, owned by this spec,
// with the 70 files and the deep file written into src/, under a 10 s budget. The copy is synced through the spawned bin:
// the child must end with no signal and exit 0 inside the budget, and its published stylesheet must carry the blue of the
// small files and the red of the deep value. Emits nothing on success; throws naming the failed leg on failure. The temp
// copy is removed in a finally, so a child killed by its budget leaves nothing behind.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import { exitCodeOf } from '../../../../shared/exit-code.ts';

interface SpecInput {
  case: CoreCase;
}

const WORLD_DIR = fileURLToPath(new URL('../world', import.meta.url));
const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const SYNC_BUDGET_MS = 10_000;
const SMALL_FILES = 70;
const NESTING = 2_000;

// The one file whose css value is 2,000 parentheses deep: the shape that overflowed a lane stack before the native containment.
function deepSource(): string {
  const open = '('.repeat(NESTING);
  const close = ')'.repeat(NESTING);
  return `import { css } from '@reference-ui/react'\n\nexport const deep = css({ color: ${open}'red'${close} })\n`;
}

function smallSource(index: number): string {
  return `import { css } from '@reference-ui/react'\n\nexport const p${index} = css({ color: 'blue' })\n`;
}

// A fresh copy of the committed world, with its real path so the sync resolves the same root, and its sources written in.
function buildWorld(): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-05-')));
  cpSync(WORLD_DIR, dir, { recursive: true });
  const src = path.join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(path.join(src, 'deep.ts'), deepSource(), 'utf8');
  for (let i = 0; i < SMALL_FILES; i++) {
    writeFileSync(path.join(src, `p${i}.ts`), smallSource(i), 'utf8');
  }
  return dir;
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = buildWorld();
  try {
    const started = Date.now();
    const sync = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      encoding: 'utf8',
      timeout: SYNC_BUDGET_MS,
      killSignal: 'SIGKILL',
    });
    const elapsed = Date.now() - started;
    const reason = sync.error ? ` (${sync.error.message})` : '';
    assert.equal(
      sync.signal,
      null,
      `ref sync ends with no signal inside ${SYNC_BUDGET_MS} ms, got signal ${sync.signal} after ${elapsed} ms${reason}: ${sync.stderr}`
    );
    assert.equal(
      exitCodeOf(sync.status, sync.signal),
      0,
      `ref sync exits 0 inside ${SYNC_BUDGET_MS} ms, got status ${sync.status} after ${elapsed} ms: ${sync.stderr}`
    );
    const sheet = readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
    assert.match(sheet, /color: blue/, 'the stylesheet carries the colour of the 70 small files');
    assert.match(sheet, /color: red/, 'the stylesheet carries the colour of the 2,000-deep value');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
