// type.spec.ts — spec for NEO-TYPE-10, the synced-register case. Takes nothing from
// the runner: it builds a publisher named @reference-ui/lib and three consumers in a
// mkdtemp dir, syncs the publisher and the strict and open consumers, and typechecks
// one consumer file per variant. Emits nothing on success; throws naming the register
// that was not declared, the diagnostic that did not match its variant, or the flip
// that stayed narrow.
import assert from 'node:assert/strict';
import { execFile, type ExecFileException } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { sync } from '../../../../../src/sync/index.ts';

const MAX_LINES = 40;
const TSC_TIMEOUT_MS = 180000;
const LIB = '@reference-ui/lib';
const OFF_TOKEN = 'neoOffToken10';
const VALID_TOKEN = 'brand';
const ENV_LINE = '/// <reference types="@reference-ui/react" />\n';
const NO_ENV = '';
const REGISTER = 'export interface SyncedSystem {}';
const STRICT_WRAPPER = 'StrictColorProps<BaseStyleProps>';
// The fill a consumer's sync appends to react.d.mts: an optional one-line doc, then the lib block.
const LIB_FILL = /(?:\/\*\*[^\n]*\*\/\n)?declare module '@reference-ui\/lib' \{\n[\s\S]*?\n\}\n/;
const DIAGNOSTIC = /^(.+?)\((\d+),\d+\): error (TS\d+): /;

// One consumer file: the off-token colour on its own line, one declared token on the next.
const CONSUMER = [
  `import { Div } from '${LIB}'`,
  '',
  `export const off = <Div color="${OFF_TOKEN}" />`,
  `export const valid = <Div color="${VALID_TOKEN}" />`,
  '',
].join('\n');

const TOKENS = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  "    ink: { value: '#111111' },",
  '  },',
  '})',
  '',
].join('\n');

interface Diagnostic {
  file: string;
  line: number;
  code: string;
}

interface TscRun {
  code: number | null;
  output: string;
  diagnostics: Diagnostic[];
}

interface Fixture {
  publisher: string;
  strict: string;
  open: string;
  unsynced: string;
}

function tscBin(): string {
  // Resolve through package.json, not the bin subpath: the exports map does not expose bin/tsc.
  const pkgFile = createRequire(import.meta.url).resolve('typescript/package.json');
  return path.join(path.dirname(pkgFile), 'bin', 'tsc');
}

// The react shims the generated declarations import: the temp projects have no node_modules of their own.
function reactShims(): Record<string, string[]> {
  const resolveFrom = createRequire(import.meta.url);
  const react = path.dirname(resolveFrom.resolve('@types/react/package.json'));
  const reactDom = path.dirname(resolveFrom.resolve('@types/react-dom/package.json'));
  return {
    react: [path.join(react, 'index.d.ts')],
    'react/jsx-runtime': [path.join(react, 'jsx-runtime.d.ts')],
    'react-dom/client': [path.join(reactDom, 'client.d.ts')],
  };
}

// The NEO-TYPE-01 options: NodeNext, strict, skipLibCheck off, so lib's own declarations are checked too.
function tsconfigSource(): string {
  const compilerOptions = {
    strict: true,
    noEmit: true,
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    jsx: 'react-jsx',
    target: 'ES2022',
    lib: ['ES2022', 'DOM'],
    skipLibCheck: false,
    paths: reactShims(),
  };
  return `${JSON.stringify({ compilerOptions, include: ['consumer.tsx', 'env.d.ts'] }, null, 2)}\n`;
}

function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}

function configSource(name: string, strict: boolean): string {
  const narrow = strict ? ["  strict: ['colors'],"] : [];
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    `  name: '${name}',`,
    "  include: ['theme/**/*.{ts,tsx}'],",
    ...narrow,
    '})',
    '',
  ].join('\n');
}

function writeProject(dir: string, pkg: object, name: string, strict: boolean): void {
  writeFiles(dir, {
    'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
    'ui.config.ts': configSource(name, strict),
    'theme/tokens.ts': TOKENS,
  });
}

function writePublisher(dir: string): void {
  const exportsMap = { '.': { types: './.reference-ui/react/react.d.mts' } };
  writeProject(dir, { name: LIB, version: '0.0.0', type: 'module', exports: exportsMap }, 'neo-lib', false);
}

// A consumer reaches lib through node_modules, so the link must exist before its sync reads it.
function writeConsumer(dir: string, name: string, strict: boolean, publisher: string): void {
  writeProject(dir, { name: 'app', version: '0.0.0', type: 'module' }, name, strict);
  writeFiles(dir, { 'consumer.tsx': CONSUMER, 'tsconfig.json': tsconfigSource() });
  const scope = path.join(dir, 'node_modules', '@reference-ui');
  fs.mkdirSync(scope, { recursive: true });
  fs.symlinkSync(publisher, path.join(scope, 'lib'), 'dir');
}

function readText(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function reactDeclaration(dir: string): string {
  return readText(path.join(dir, '.reference-ui', 'react', 'react.d.mts'));
}

function styledTypes(dir: string): string {
  return readText(path.join(dir, '.reference-ui', 'styled', 'types', 'index.d.ts'));
}

// Materializes the publisher and the three consumers; only the publisher, strict and open are synced.
async function buildFixture(root: string): Promise<Fixture> {
  const fixture: Fixture = {
    publisher: path.join(root, 'publisher'),
    strict: path.join(root, 'strict'),
    open: path.join(root, 'open'),
    unsynced: path.join(root, 'unsynced'),
  };
  writePublisher(fixture.publisher);
  await sync(fixture.publisher);
  writeConsumer(fixture.strict, 'neo-strict', true, fixture.publisher);
  await sync(fixture.strict);
  writeConsumer(fixture.open, 'neo-open', false, fixture.publisher);
  await sync(fixture.open);
  writeConsumer(fixture.unsynced, 'neo-unsynced', false, fixture.publisher);
  return fixture;
}

// The publisher declares the empty register and types its public names through it; it never fills its own.
function assertPublisherDeclares(publisher: string): void {
  const decl = reactDeclaration(publisher);
  assert.ok(decl.includes(REGISTER), 'publisher declares an empty SyncedSystem register');
  assert.ok(!decl.includes(`declare module '${LIB}'`), 'publisher never fills its own register');
  assert.match(decl, /export declare const Div\b/, 'publisher exports the Div primitive');
}

// A synced consumer fills the register; only the strict consumer carries the strict colour wrapper.
function assertConsumerFills(dir: string, strict: boolean): void {
  const name = path.basename(dir);
  assert.ok(reactDeclaration(dir).includes(`declare module '${LIB}'`), `${name} fills the lib register`);
  assert.equal(styledTypes(dir).includes(STRICT_WRAPPER), strict, `${name} narrows colours only when strict`);
}

function exitCodeOf(err: ExecFileException | null): number | null {
  if (!err) return 0;
  if (err.killed) return null;
  return typeof err.code === 'number' ? err.code : 1;
}

// Each diagnostic's file is resolved against the project, so relative and absolute paths compare alike.
function parseDiagnostics(dir: string, output: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  for (const raw of output.split('\n')) {
    const match = DIAGNOSTIC.exec(raw.trim());
    if (match) found.push({ file: path.resolve(dir, match[1]), line: Number(match[2]), code: match[3] });
  }
  return found;
}

function runTsc(dir: string): Promise<TscRun> {
  return new Promise((resolve) => {
    const args = [tscBin(), '--noEmit', '-p', dir];
    execFile(process.execPath, args, { cwd: dir, timeout: TSC_TIMEOUT_MS }, (err, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`;
      resolve({ code: exitCodeOf(err), output, diagnostics: parseDiagnostics(dir, output) });
    });
  });
}

// Writes this run's env.d.ts, then typechecks the consumer project as it stands.
async function typecheck(dir: string, envSource: string): Promise<TscRun> {
  writeFiles(dir, { 'env.d.ts': envSource });
  return runTsc(dir);
}

function capped(output: string): string {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) lines.push('tsc failed with no diagnostics');
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return shown.join('\n');
}

function linesIn(run: TscRun, file: string): number[] {
  return run.diagnostics.filter((d) => d.file === file).map((d) => d.line);
}

function errorsUnder(run: TscRun, root: string): string[] {
  return run.diagnostics
    .filter((d) => d.file.startsWith(`${root}${path.sep}`))
    .map((d) => `${d.file}(${d.line}) ${d.code}`);
}

function lineOf(source: string, needle: string): number {
  const index = source.split('\n').findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `the consumer source carries ${needle}`);
  return index + 1;
}

// The strict consumer with the env line: the off token is the only error, on its own line, and nothing under lib errors.
function assertOffTokenRejected(run: TscRun, dir: string, publisher: string): void {
  const consumer = path.join(dir, 'consumer.tsx');
  assert.notEqual(run.code, 0, `strict consumer with the env line typechecks, but it must reject ${OFF_TOKEN}`);
  assert.ok(run.output.includes(OFF_TOKEN), `the rejection names ${OFF_TOKEN}:\n${capped(run.output)}`);
  assert.ok(run.output.includes('TS2322'), `the off-token rejection is TS2322:\n${capped(run.output)}`);
  assert.deepEqual(errorsUnder(run, publisher), [], 'no error under the publisher path');
  const offLine = lineOf(CONSUMER, OFF_TOKEN);
  assert.deepEqual(
    linesIn(run, consumer),
    [offLine],
    `only the ${OFF_TOKEN} line errors; the ${VALID_TOKEN} line has no error:\n${capped(run.output)}`,
  );
}

function assertClean(run: TscRun, what: string): void {
  assert.equal(run.code, 0, `${what} typechecks clean:\n${capped(run.output)}`);
}

// The flip removes the lib fill and nothing else, so the register falls back to the empty open declaration.
function stripLibFill(text: string): string {
  assert.match(text, LIB_FILL, 'the strict react.d.mts carries the lib fill before the flip');
  const stripped = text.replace(LIB_FILL, '');
  assert.ok(!stripped.includes(`declare module '${LIB}'`), 'the flip leaves no lib augmentation');
  return stripped;
}

async function checkFlip(strictDir: string): Promise<void> {
  const file = path.join(strictDir, '.reference-ui', 'react', 'react.d.mts');
  fs.writeFileSync(file, stripLibFill(readText(file)));
  assertClean(await typecheck(strictDir, ENV_LINE), 'the strict world with the lib fill stripped');
}

async function checkRegister(root: string): Promise<void> {
  const f = await buildFixture(root);
  assertPublisherDeclares(f.publisher);
  assertConsumerFills(f.strict, true);
  assertConsumerFills(f.open, false);
  assert.ok(!fs.existsSync(path.join(f.unsynced, '.reference-ui')), 'the unsynced consumer has no generated folder');

  assertOffTokenRejected(await typecheck(f.strict, ENV_LINE), f.strict, f.publisher);
  assertClean(await typecheck(f.strict, NO_ENV), 'strict consumer without the env line');
  assertClean(await typecheck(f.open, ENV_LINE), 'open consumer with the env line');
  assertClean(await typecheck(f.unsynced, NO_ENV), 'unsynced consumer');
  await checkFlip(f.strict);
}

export default async function run(): Promise<void> {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-10-')));
  try {
    await checkRegister(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
