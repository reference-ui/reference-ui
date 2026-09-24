// lifecycle.spec.ts — spec for NEO-CLI-01, the CLI lifecycle port of the
// matrix distro core. Takes { case } with the world freshly synced and drives
// the real spawned `ref` binary through four legs: an idempotent re-sync, a
// stale-marker rewrite, a SIGTERM mid-publish with recovery, and a clean
// round-trip. Emits nothing on success; throws naming the leg and the failed
// expectation on failure.
import { execFileSync, spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const SYSTEM_NAME = 'neo-cli';
const KILL_ATTEMPTS = 10;
// The §3.12 one-line success shape: glyph + command + stats. Plain under a
// pipe, ANSI-spanned under a terminal — the pin strips spans first, so the
// shape holds however the child ran.
const SYNC_LINE_RE = /⎔ ref sync ⫶ \d+ ms ⫶ [\d.]+ (B|KB|MB)/;
const ANSI_SPAN_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

const EXPECTED_FILES = [
  'system/baseSystem.mjs',
  'system/system.mjs',
  'system/package.json',
  'styled/styles.css',
  'styled/package.json',
  'react/react.mjs',
  'react/package.json',
];

const LINKED_PACKAGES = ['system', 'styled', 'react'];

const PROBE_SCRIPT = [
  "const react = await import('@reference-ui/react')",
  "const system = await import('@reference-ui/system/baseSystem')",
  "if (typeof react.css !== 'function') throw new Error('expected generated css export')",
  `if (!system.baseSystem || system.baseSystem.name !== '${SYSTEM_NAME}') throw new Error('expected generated baseSystem export')`,
  "console.log('ok')",
].join('; ');

// Shells one child process and returns its stdout. A failure throws naming
// the command with both streams attached, so a red leg reads as the CLI's
// own verdict instead of a bare exit code.
function execOutput(command: string, args: string[], cwd: string): string {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
  } catch (error) {
    throw new Error(execFailureText(command, args, error));
  }
}

function streamText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return '(unavailable)';
}

function execFailureText(command: string, args: string[], error: unknown): string {
  let stdout = '(unavailable)';
  let stderr = '(unavailable)';
  if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
    const streams = error as Error & { stdout: unknown; stderr: unknown };
    stdout = streamText(streams.stdout);
    stderr = streamText(streams.stderr);
  }
  return [`${command} ${args.join(' ')} failed`, '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join(
    '\n',
  );
}

function runRef(args: string[], worldDir: string): string {
  return execOutput(process.execPath, [BIN_PATH, ...args], worldDir);
}

function stripAnsiSpans(text: string): string {
  return text.replace(ANSI_SPAN_RE, '');
}

// The one-shot success print: some line of the child's stdout carries the
// §3.12 shape. A contains-pin, not whole-output equality — the background
// tasty phase may land its own stdout lines alongside on a slow exit.
function carriesSyncLine(output: string): boolean {
  return output.split('\n').some((line) => SYNC_LINE_RE.test(stripAnsiSpans(line)));
}

// The consumer import probe: resolves the sync-made scope links from the
// world root and reads one export per generated package. Prints 'ok' only
// when both legs of the consumer surface hold.
function runImportProbe(worldDir: string): string {
  return execOutput(process.execPath, ['--input-type=module', '-e', PROBE_SCRIPT], worldDir).trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Published entries under the generated folder, or zero when the folder is
// absent mid-clean. The kill leg polls this hot: it trips the moment the
// first publish leg lands, which is the earliest a SIGTERM can strand a
// partial folder.
function publishedFileCount(worldDir: string): number {
  try {
    return fs.readdirSync(path.join(worldDir, '.reference-ui')).length;
  } catch {
    return 0;
  }
}

interface KillResult {
  signal: NodeJS.Signals | null;
  sawPublish: boolean;
}

// Cleans the world, spawns a one-shot `ref sync`, and SIGTERMs it the
// instant the first published file lands. The exit resolves from the live
// handle when the child is already gone, so a sub-second sync cannot strand
// the wait on an event that already fired.
async function killAfterFirstPublish(worldDir: string): Promise<KillResult> {
  runRef(['clean', worldDir], worldDir);
  const child = spawn(process.execPath, [BIN_PATH, 'sync', worldDir], { cwd: worldDir, stdio: 'ignore' });
  let sawPublish = false;
  const deadline = Date.now() + 30000;
  while (child.exitCode === null && child.signalCode === null) {
    if (publishedFileCount(worldDir) > 0) {
      sawPublish = true;
      child.kill('SIGTERM');
      break;
    }
    if (Date.now() > deadline) {
      child.kill('SIGTERM');
      break;
    }
    await sleep(5);
  }
  if (child.exitCode !== null || child.signalCode !== null) {
    return { signal: child.signalCode, sawPublish };
  }
  const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return { signal: exit.signal, sawPublish };
}

// The post-heal shape every leg asserts: the full file set plus one stable
// content pin per runtime leg — the system name, the tokens collector, and
// the brand token the sheet carries.
function generatedShape(worldDir: string): void {
  const outDir = path.join(worldDir, '.reference-ui');
  for (const file of EXPECTED_FILES) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `synced folder carries ${file}`);
  }
  const baseSystem = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.mjs'), 'utf8');
  assert.ok(baseSystem.includes(SYSTEM_NAME), 'base system carries the system name');
  const systemRuntime = fs.readFileSync(path.join(outDir, 'system', 'system.mjs'), 'utf8');
  assert.ok(systemRuntime.includes('function tokens('), 'system runtime carries the tokens collector');
  const sheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(sheet.includes('--colors-brand: #7c3aed'), 'sheet carries the brand token');
}

function proveIdempotentResync(worldDir: string): void {
  const sheetPath = path.join(worldDir, '.reference-ui', 'styled', 'styles.css');
  const before = fs.readFileSync(sheetPath, 'utf8');
  const output = runRef(['sync', worldDir], worldDir);
  assert.ok(carriesSyncLine(output), 'one-shot sync prints the one-line success shape');
  assert.equal(fs.readFileSync(sheetPath, 'utf8'), before, 'a second sync is byte-identical');
  assert.equal(runImportProbe(worldDir), 'ok', 'consumer imports work after the re-sync');
}

function proveStaleRewrite(worldDir: string): void {
  const outDir = path.join(worldDir, '.reference-ui');
  const reactPath = path.join(outDir, 'react', 'react.mjs');
  const systemPath = path.join(outDir, 'system', 'system.mjs');
  const basePath = path.join(outDir, 'system', 'baseSystem.mjs');
  fs.writeFileSync(reactPath, 'STALE_REACT_RUNTIME_MARKER');
  fs.writeFileSync(systemPath, 'STALE_SYSTEM_RUNTIME_MARKER');
  fs.writeFileSync(basePath, 'STALE_BASE_SYSTEM_MARKER');
  runRef(['sync', worldDir], worldDir);
  const nextReact = fs.readFileSync(reactPath, 'utf8');
  const nextSystem = fs.readFileSync(systemPath, 'utf8');
  const nextBase = fs.readFileSync(basePath, 'utf8');
  assert.ok(!nextReact.includes('STALE_REACT_RUNTIME_MARKER'), 'cold sync rewrites the stale react runtime');
  assert.ok(!nextSystem.includes('STALE_SYSTEM_RUNTIME_MARKER'), 'cold sync rewrites the stale system runtime');
  assert.ok(!nextBase.includes('STALE_BASE_SYSTEM_MARKER'), 'cold sync rewrites the stale base system');
  assert.ok(nextBase.includes(SYSTEM_NAME), 'rewritten base system carries the system name');
  assert.ok(nextSystem.includes('function tokens('), 'rewritten system runtime carries the tokens collector');
  assert.equal(runImportProbe(worldDir), 'ok', 'consumer imports work after the stale rewrite');
}

// Kills syncs until one dies by SIGTERM after the tripwire fired — a
// sub-second sync can outrun any single attempt, so the loop retries the
// cheap cycle instead of asserting on one race. The next sync then proves
// the stranded folder heals to the full shape with working imports.
async function proveInterruptRecovery(worldDir: string): Promise<void> {
  let attempts = 0;
  let caught = false;
  while (!caught && attempts < KILL_ATTEMPTS) {
    attempts += 1;
    const { signal, sawPublish } = await killAfterFirstPublish(worldDir);
    caught = signal === 'SIGTERM' && sawPublish;
  }
  assert.ok(caught, `a sync dies by SIGTERM after first publish within ${KILL_ATTEMPTS} attempts, caught none`);
  runRef(['sync', worldDir], worldDir);
  generatedShape(worldDir);
  assert.equal(runImportProbe(worldDir), 'ok', 'consumer imports work after interrupt recovery');
}

function proveCleanRestore(worldDir: string): void {
  const outDir = path.join(worldDir, '.reference-ui');
  const reactPath = path.join(outDir, 'react', 'react.mjs');
  const basePath = path.join(outDir, 'system', 'baseSystem.mjs');
  assert.ok(fs.existsSync(reactPath), 'react runtime exists before clean');
  assert.ok(fs.existsSync(basePath), 'base system exists before clean');
  runRef(['clean', worldDir], worldDir);
  assert.ok(!fs.existsSync(outDir), 'clean removes the generated folder');
  for (const name of LINKED_PACKAGES) {
    assert.ok(
      !fs.existsSync(path.join(worldDir, 'node_modules', '@reference-ui', name)),
      `clean removes the ${name} scope link`,
    );
  }
  runRef(['sync', worldDir], worldDir);
  assert.ok(fs.existsSync(reactPath), 'sync restores the react runtime after clean');
  assert.ok(fs.existsSync(basePath), 'sync restores the base system after clean');
  assert.equal(runImportProbe(worldDir), 'ok', 'consumer imports work after the clean restore');
}

// The runner synced this world before serving: prove the four legs in
// lifecycle order, then heal with a final sync in a finally, so no outcome
// leaves the world unusable for the next run.
export default async function run({ case: c }: SpecInput): Promise<void> {
  try {
    proveIdempotentResync(c.worldDir);
    proveStaleRewrite(c.worldDir);
    await proveInterruptRecovery(c.worldDir);
    proveCleanRestore(c.worldDir);
  } finally {
    try {
      runRef(['sync', c.worldDir], c.worldDir);
    } catch {
      console.log('[NEO-CLI-01] warning: final heal sync failed; the runner re-syncs before the next serve');
    }
  }
}
