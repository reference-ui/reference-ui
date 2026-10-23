// braces.spec.ts — spec for CORE-BOUND-04: a hostile include pattern fails ref sync by name. It takes { case } from the
// runner, which serves this world unsynced, and runs two legs, each in a temp copy whose ui.config.ts is rewritten as a
// string: braces that expand past 1,024 globs, and braces nested past 64 levels. Each leg spawns the bin's sync under a
// 10 s budget and expects exit 1, no signal, and the config error naming the pattern. Emits nothing on success; throws
// naming the leg and what came back wrong. Each temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';

interface SpecInput {
  case: CoreCase;
}

interface Leg {
  label: string;
  pattern: string;
  reason: string;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const SYNC_BUDGET_MS = 10_000;
const NEST_LEVELS = 65;

const LEGS: Leg[] = [
  { label: 'wide', pattern: `src/${'{a,b}'.repeat(24)}.ts`, reason: 'expands to more than 1,024 globs' },
  {
    label: 'deep',
    pattern: `src/${'{a,'.repeat(NEST_LEVELS)}b${'}'.repeat(NEST_LEVELS)}.ts`,
    reason: 'nests braces deeper than 64 levels',
  },
];

// Bad configs ride as strings, as CORE-SYNC-08's do, so the committed world stays a valid typed config.
function configFile(pattern: string): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    '',
    'export default defineConfig({',
    "  name: 'core-bound-04',",
    `  include: ['${pattern}'],`,
    '})',
    '',
  ].join('\n');
}

function runLeg(worldDir: string, leg: Leg): void {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `core-bound-04-${leg.label}-`)));
  try {
    cpSync(worldDir, dir, { recursive: true });
    writeFileSync(path.join(dir, 'ui.config.ts'), configFile(leg.pattern));
    const run = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      env: CHILD_ENV,
      encoding: 'utf8',
      timeout: SYNC_BUDGET_MS,
      killSignal: 'SIGKILL',
    });
    const output = `${run.stdout}${run.stderr}`;
    const cause = run.error ? ` (${run.error.message})` : '';
    assert.equal(run.signal, null, `${leg.label}: ref sync ends inside ${SYNC_BUDGET_MS} ms, got signal ${run.signal}${cause}`);
    assert.equal(run.status, 1, `${leg.label}: ref sync exits 1, got ${run.status}: ${output.slice(0, 2000)}`);
    const line = `include pattern '${leg.pattern}' ${leg.reason}`;
    assert.ok(output.includes(line), `${leg.label}: ref sync prints "${line}", got: ${output.slice(0, 2000)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  for (const leg of LEGS) runLeg(c.worldDir, leg);
}
