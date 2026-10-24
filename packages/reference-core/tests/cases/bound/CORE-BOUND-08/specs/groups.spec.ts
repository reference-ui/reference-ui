// groups.spec.ts is the spec for CORE-BOUND-08, which syncs refused includes and a paren group.
// An include the walk cannot model must fail by name, and a paren group must read as an alternation. It takes { case } from
// the runner, which serves this world unsynced, and spawns the bin's sync under a 10 s budget in temp copies of the world. Three refused includes (an extglob, a POSIX class, a ** inside a folder name) must exit 1 with no signal
// and print the pattern and the form to write; the committed include `src/(a|b)/*.ts` must exit 0 with the CSS of src/a and src/b but
// not src/c. Emits nothing on success; throws naming the leg and what came back wrong. Each temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';

interface SpecInput {
  case: CoreCase;
}

interface RefusedLeg {
  label: string;
  pattern: string;
  message: string;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const SYNC_BUDGET_MS = 10_000;

const REFUSED: RefusedLeg[] = [
  {
    label: 'extglob',
    pattern: 'src/@(a|b)/*.ts',
    message: 'uses parentheses or a pipe that sync cannot read; write {a,b} for alternatives',
  },
  {
    label: 'posix',
    pattern: 'src/[[:alpha:]]/*.ts',
    message: 'uses a POSIX class; write a plain class such as [a-zA-Z] or [0-9]',
  },
  {
    label: 'globstar',
    pattern: 'src/**x/*.ts',
    message: 'has ** inside a folder name; write **/*x or x*/** with ** as a whole folder name',
  },
];

// Bad configs ride as strings, as CORE-BOUND-04's do, so the committed world stays a valid typed config.
function configFile(pattern: string): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    '',
    'export default defineConfig({',
    "  name: 'core-bound-08',",
    `  include: ['${pattern}'],`,
    '})',
    '',
  ].join('\n');
}

function copyWorld(worldDir: string, label: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `core-bound-08-${label}-`)));
  cpSync(worldDir, dir, { recursive: true });
  return dir;
}

function syncIn(dir: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
    cwd: dir,
    env: CHILD_ENV,
    encoding: 'utf8',
    timeout: SYNC_BUDGET_MS,
    killSignal: 'SIGKILL',
  });
}

function runRefused(worldDir: string, leg: RefusedLeg): void {
  const dir = copyWorld(worldDir, leg.label);
  try {
    writeFileSync(path.join(dir, 'ui.config.ts'), configFile(leg.pattern));
    const run = syncIn(dir);
    const output = `${run.stdout}${run.stderr}`;
    const cause = run.error ? ` (${run.error.message})` : '';
    assert.equal(run.signal, null, `${leg.label}: ref sync ends inside ${SYNC_BUDGET_MS} ms, got signal ${run.signal}${cause}`);
    assert.equal(run.status, 1, `${leg.label}: ref sync exits 1, got ${run.status}: ${output.slice(0, 2000)}`);
    const line = `include pattern '${leg.pattern}' ${leg.message}`;
    assert.ok(output.includes(line), `${leg.label}: ref sync prints "${line}", got: ${output.slice(0, 2000)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runGroup(worldDir: string): void {
  const dir = copyWorld(worldDir, 'group');
  try {
    const run = syncIn(dir);
    const output = `${run.stdout}${run.stderr}`;
    const cause = run.error ? ` (${run.error.message})` : '';
    assert.equal(run.status, 0, `group: ref sync exits 0 inside ${SYNC_BUDGET_MS} ms, got status ${run.status} and signal ${run.signal}${cause}: ${output.slice(0, 2000)}`);
    const sheet = readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
    assert.match(sheet, /color: red/, 'group: the sheet carries the colour of src/a/app.ts');
    assert.match(sheet, /color: blue/, 'group: the sheet carries the colour of src/b/app.ts');
    assert.doesNotMatch(sheet, /color: green/, 'group: the sheet leaves out the colour of src/c/app.ts');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  for (const leg of REFUSED) runRefused(c.worldDir, leg);
  runGroup(c.worldDir);
}
