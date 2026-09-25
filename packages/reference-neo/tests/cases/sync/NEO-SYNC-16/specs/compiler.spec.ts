// compiler.spec.ts — spec for NEO-SYNC-16, the compiler backchannel case. Takes
// { case } from the runner with the world UNSYNCED (the hook is off: the spec
// drives sync itself under a console.warn spy) and asserts node-side. Emits
// nothing on success; throws when the request drops the opt-in, when the
// channel stays silent, or when userspace leaks channel-family codes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Mirror of the ATM-DIAG-07 channel-family predicate: true facts that prove
// no exact runtime miss ride the compiler channel only.
const CHANNEL_CODE = /ATM-W-DYNAMIC-|ATM-W-UNFOLDABLE-SPREAD|ATM-I-HARVEST-SINK|ATM-I-DEAD-BRANCH/;

const PLAIN_CONFIG = [
  'import { defineConfig } from \'@reference-ui/neo\'',
  '',
  'export default defineConfig({',
  '  name: \'neo-sync16-plain\',',
  '  include: [\'theme/**/*.{ts,tsx}\'],',
  '})',
  '',
].join('\n');

async function syncWithWarnCapture(dir: string, verbose: boolean): Promise<string[]> {
  const calls: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]): void => {
    calls.push(args.map(String).join(' '));
  };
  try {
    await sync(dir, { verbose });
  } finally {
    console.warn = original;
  }
  return calls;
}

// The runner served this world without syncing it: the opt-in world threads
// logs through the frozen request and counts the channel in the one-line
// summary by default, lists it behind the compiler tag under verbose,
// while a no-logs copy of the same world stays compiler-silent.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const calls = await syncWithWarnCapture(c.worldDir, false);

  // (i) config threading: the frozen request carries the opt-in.
  const requestPath = path.join(c.worldDir, '.reference-ui', 'system', 'compile-request.json');
  assert.ok(fs.existsSync(requestPath), 'synced folder carries system/compile-request.json');
  const request = JSON.parse(fs.readFileSync(requestPath, 'utf8')) as { logs?: string[] };
  assert.deepStrictEqual(request.logs, ['compiler'], 'compile-request.json carries logs [compiler]');

  // (ii) default summary: one call, the counted line, no codes.
  assert.equal(calls.length, 1, `expected one warning call, got ${calls.length}`);
  assert.match(calls[0], /^⚠ \d+ warnings? \[--verbose\]$/, 'default prints the one-line summary');
  assert.doesNotMatch(calls[0], /ATM-/, 'default summary carries no codes');

  // (ii) verbose list: one call whose compiler-tagged lines carry the codes.
  const verbose = await syncWithWarnCapture(c.worldDir, true);
  assert.equal(verbose.length, 1, `expected one verbose call, got ${verbose.length}`);
  const lines = verbose.join('\n').split('\n');
  const compiler = lines.filter((line) => line.includes('[compiler]'));
  assert.ok(compiler.length > 0, 'verbose lists compiler-tagged lines');
  assert.match(compiler.join('\n'), /ATM-W-DYNAMIC-[A-Z0-9-]+/, 'compiler output names a dynamic code');
  assert.ok(
    compiler.join('\n').includes('ATM-W-UNFOLDABLE-SPREAD'),
    'compiler output names the spread code',
  );
  assert.ok(
    compiler.join('\n').includes('ATM-I-HARVEST-SINK'),
    'compiler output names the harvest code',
  );
  assert.ok(
    compiler.join('\n').includes('ATM-I-DEAD-BRANCH'),
    'compiler output names the dead-branch code',
  );

  // (iii) isolation: userspace lines carry no channel-family code.
  const userspace = lines.filter((line) => !line.includes('[compiler]')).join('\n');
  assert.doesNotMatch(userspace, CHANNEL_CODE, 'userspace lines carry no channel-family code');

  // (iii) isolation, second half: the same world without logs prints none.
  const plainDir = fs.mkdtempSync(path.join(tmpdir(), 'neo-sync16-'));
  try {
    fs.cpSync(path.join(c.worldDir, 'theme'), path.join(plainDir, 'theme'), { recursive: true });
    fs.writeFileSync(path.join(plainDir, 'ui.config.ts'), PLAIN_CONFIG);
    const plainCalls = await syncWithWarnCapture(plainDir, false);
    assert.ok(
      !plainCalls.join('\n').includes('[compiler]'),
      'no-logs world prints no compiler output',
    );
    assert.ok(
      fs.existsSync(path.join(plainDir, '.reference-ui', 'styled', 'styles.css')),
      'no-logs world still syncs green',
    );
  } finally {
    fs.rmSync(plainDir, { recursive: true, force: true });
  }
}
