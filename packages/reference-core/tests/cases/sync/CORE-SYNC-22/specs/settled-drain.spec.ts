// settled-drain.spec.ts — spec for CORE-SYNC-22: a settled tasty failure is one error and exit 0.
// Takes { case } from the runner, which serves this world unsynced, and copies the world to a temp project
// with a source that is not valid UTF-8, so CSS syncs but the tasty scan fails. It runs sync in-process with console
// captured, waits until the cold build is no longer pending, then runs the one-shot finisher: exit 0, the coded error
// once, the Errors row, the stylesheet written, and a second drain with nothing left. Emits nothing on success; throws
// naming what came back wrong. The temp project is removed and the console restored in a finally.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import { flushReferenceBuild, isReferenceBuildPending } from '../../../../../src/reference/bridge/index.ts';
import { finishOneShotSync } from '../../../../../src/cli/sync.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  case: CoreCase;
}

// Latin-1 é is the byte 0xE9 on its own: not valid UTF-8, so tasty's read fails. CSS reads lossily and syncs clean.
const BROKEN_SOURCE = 'export const broken = "café"\n';
const ERROR_CODE = 'TST-E-SCAN-FAILED';
const SUMMARY_ROW = 'Errors:    1 tasty error';
const SETTLE_MS = 60_000;

// A fresh copy of the committed world plus the broken source, with its real path so every call resolves one root.
function brokenWorld(worldDir: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-sync-22-')));
  cpSync(worldDir, dir, { recursive: true });
  writeFileSync(path.join(dir, 'src', 'broken.ts'), Buffer.from(BROKEN_SOURCE, 'latin1'));
  return dir;
}

async function waitUntilSettled(dir: string): Promise<void> {
  const deadline = Date.now() + SETTLE_MS;
  while (isReferenceBuildPending(dir)) {
    assert.ok(Date.now() < deadline, `the cold tasty build settles inside ${SETTLE_MS} ms`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// Capture every console line while fn runs, restoring the console after, so the spec counts what a user would see.
async function withCapturedConsole<T>(fn: () => Promise<T>): Promise<{ value: T; output: string }> {
  const lines: string[] = [];
  const { log, error } = console;
  console.log = (...args: unknown[]) => void lines.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => void lines.push(args.map(String).join(' '));
  try {
    return { value: await fn(), output: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = error;
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const dir = brokenWorld(c.worldDir);
  const noColor = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
  try {
    const { value, output } = await withCapturedConsole(async () => {
      const result = await sync(dir);
      await waitUntilSettled(dir);
      const exit = await finishOneShotSync(dir, result, { started: Date.now(), verbose: false, quiet: false, json: false });
      return { exit, outDir: result.outDir };
    });
    assert.equal(value.exit, 0, `a tasty failure leaves the one-shot exit at 0, got ${value.exit}: ${output}`);
    const reports = output.split(ERROR_CODE).length - 1;
    assert.equal(reports, 1, `the tasty error prints exactly once, got ${reports}: ${output}`);
    assert.ok(output.includes(SUMMARY_ROW), `the summary names the tasty error, got: ${output}`);
    assert.ok(existsSync(path.join(value.outDir, 'styled', 'styles.css')), 'the stylesheet is still written');
    const second = await flushReferenceBuild(dir);
    assert.equal(second, undefined, `the drain left nothing behind, got ${JSON.stringify(second)}`);
  } finally {
    if (noColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = noColor;
    rmSync(dir, { recursive: true, force: true });
  }
}
