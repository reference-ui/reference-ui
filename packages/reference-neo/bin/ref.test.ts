// Unit tests for the ref bin over temp projects plus arg handling.
// They take temp dirs with fake generated output and assert clean removes
// exactly that output, plus warning fixtures proving sync folds warnings
// into the boot block by default and lists them structured under --verbose,
// plus json diagnostics proving the canonical stdout array.
// Deep sync behavior stays proven live in case worlds.
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const BIN_PATH = fileURLToPath(new URL('./ref.ts', import.meta.url));
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

interface BinRun {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runBin(args: string[], cwd: string): Promise<BinRun> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [BIN_PATH, ...args],
      { cwd, timeout: 120000, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: undefined } },
      (err, stdout, stderr) => {
        resolve({
          code: err ? ((err as { code?: number }).code ?? 1) : 0,
          stdout: String(stdout),
          stderr: String(stderr),
        });
      }
    );
  });
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ref-bin-'));
  tempDirs.push(dir);
  return dir;
}

function plantGeneratedOutput(dir: string): { outDir: string; scope: string } {
  const outDir = join(dir, '.reference-ui');
  mkdirSync(join(outDir, 'system'), { recursive: true });
  writeFileSync(join(outDir, 'system', 'system.mjs'), 'export {}\n');
  const scope = join(dir, 'node_modules', '@reference-ui');
  mkdirSync(scope, { recursive: true });
  symlinkSync(join(outDir, 'system'), join(scope, 'system'), 'junction');
  symlinkSync(join(outDir, 'styled'), join(scope, 'styled'), 'junction');
  return { outDir, scope };
}

describe('ref bin', () => {
  it('prints usage and exits 0 on --help', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['--help'], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('usage: ref <sync|clean> [dir]');
  });

  it('rejects an unknown command with usage and exit 1', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['frobnicate'], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('usage: ref <sync|clean> [dir]');
    expect(run.stdout).toContain('unknown command: frobnicate');
  });

  it('clean reports nothing to remove on an empty dir', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['clean', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('nothing to remove');
  });

  it('clean removes the folder and generated links but keeps real dirs', async () => {
    const dir = await makeTempDir();
    const { outDir, scope } = plantGeneratedOutput(dir);
    const realDir = join(scope, 'react');
    mkdirSync(realDir, { recursive: true });
    writeFileSync(join(realDir, 'keep.mjs'), 'export {}\n');

    const run = await runBin(['clean', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('clean removed');
    expect(existsSync(outDir)).toBe(false);
    expect(existsSync(join(scope, 'system'))).toBe(false);
    expect(existsSync(join(scope, 'styled'))).toBe(false);
    expect(existsSync(join(realDir, 'keep.mjs'))).toBe(true);
  });

  it('sync fails loud with exit 1 when no config exists', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['sync', dir], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('sync failed');
  });

  it('sync --watch fails loud with exit 1 when no config exists', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['sync', '--watch', dir], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('watch failed');
  });

  it('clean rejects --watch with usage and exit 1', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['clean', '--watch', dir], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('usage: ref <sync|clean> [dir]');
    expect(run.stdout).toContain('clean takes no --watch');
  });

  it('sync prints the boot block with folded warnings and leaves stderr empty by default', async () => {
    const dir = await makeTempDir();
    plantWarningProject(dir);
    const run = await runBin(['sync', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('REF  v');
    expect(run.stdout).toContain('ready in');
    expect(run.stdout).toContain('CSS:');
    expect(run.stdout).toMatch(/Warnings:\s+3 \[--verbose\]/);
    expect(run.stderr.trim()).toBe('');
  });

  it('sync --verbose lists every warning with location, message, and fix hint', async () => {
    const dir = await makeTempDir();
    plantWarningProject(dir);
    const run = await runBin(['sync', '--verbose', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('REF  v');
    expect(run.stdout).toContain('ready in');
    expect(run.stdout).not.toContain('Warnings:');
    assertVerboseWarningList(run.stderr);
  });

  it('sync --quiet prints nothing on success', async () => {
    const dir = await makeTempDir();
    plantWarningProject(dir);
    const run = await runBin(['sync', '--quiet', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout.trim()).toBe('');
    expect(run.stderr.trim()).toBe('');
  });

  it('sync --quiet still fails loud when no config exists', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['sync', '--quiet', dir], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('sync failed');
  });
});

describe('ref bin json diagnostics', () => {
  it('sync --json prints the canonical array on stdout with empty stderr', async () => {
    const dir = await makeTempDir();
    plantWarningProject(dir);
    const run = await runBin(['sync', '--json', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout.trim().split('\n')).toHaveLength(1);
    const parsed = JSON.parse(run.stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed.map((row) => row.code)).toEqual([
      'ATM-W-INVALID-CSS-VALUE',
      'ATM-W-INVALID-CSS-VALUE',
      'ATM-W-UNKNOWN-COLOR',
    ]);
    for (const row of parsed) {
      expect(Object.keys(row).slice(0, 3)).toEqual(['severity', 'code', 'message']);
      expect(row.severity).toBe('warning');
    }
    expect(run.stdout).not.toContain('ref sync');
    expect(run.stderr.trim()).toBe('');
  });

  it('sync --json folds ref diagnostics into the combined array', async () => {
    const dir = await makeTempDir();
    plantDupSymbolProject(dir);
    const run = await runBin(['sync', '--json', dir], dir);
    expect(run.code).toBe(0);
    const parsed = JSON.parse(run.stdout) as Array<Record<string, unknown>>;
    const codes = parsed.map((row) => row.code);
    expect(codes).toContain('TST-W-DUPLICATE-SYMBOL-NAME');
    expect(run.stderr.trim()).toBe('');
  });

  it('sync --json reports failures on stderr with empty stdout and exit 1', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['sync', '--json', dir], dir);
    expect(run.code).toBe(1);
    expect(run.stdout.trim()).toBe('');
    expect(run.stderr).toContain('sync failed');
  });
});

describe('ref bin tasty warnings', () => {
  it('sync folds duplicate-symbol warnings into the boot block by default', async () => {
    const dir = await makeTempDir();
    plantDupSymbolProject(dir);
    const run = await runBin(['sync', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('REF  v');
    expect(run.stdout).toMatch(/Warnings:\s+\d+ \[--verbose\]/);
    expect(run.stderr.trim()).toBe('');
  });

  it('sync --verbose lists duplicate-symbol warnings behind the ref tag', async () => {
    const dir = await makeTempDir();
    plantDupSymbolProject(dir);
    const run = await runBin(['sync', '--verbose', dir], dir);
    expect(run.code).toBe(0);
    expect(run.stderr).toContain('[ref]');
    expect(run.stderr).toContain('TST-W-DUPLICATE-SYMBOL-NAME');
    expect(run.stderr).toContain('Duplicate symbol name `Shared`');
    expect(run.stderr).toContain('use the symbol id or a scoped lookup to disambiguate');
    expect(run.stderr).not.toContain('[--verbose]');
  });
});

function assertVerboseWarningList(stderr: string): void {
  const lines = stderr.trim().split('\n');
  expect(lines).toHaveLength(3);
  const [first, second, third] = lines;
  expect(first).toContain('warn.ts:3');
  expect(first).toContain('ATM-W-INVALID-CSS-VALUE');
  expect(first).toContain('use a CSS keyword, token, or value the prop accepts');
  expect(second).toContain('warn.ts:4');
  expect(second).toContain('ATM-W-INVALID-CSS-VALUE');
  expect(third).toContain('warn.ts:5');
  expect(third).toContain('ATM-W-UNKNOWN-COLOR');
  expect(third).toContain('use a color token or a CSS color');
  expect(stderr).not.toContain('[--verbose]');
}

function plantWarningProject(dir: string): void {
  writeFileSync(
    join(dir, 'ui.config.ts'),
    [
      "import { defineConfig } from '@reference-ui/neo'",
      '',
      'export default defineConfig({',
      "  name: 'ref-bin-warn',",
      "  include: ['theme/**/*.{ts,tsx}'],",
      '})',
      '',
    ].join('\n')
  );
  mkdirSync(join(dir, 'theme'), { recursive: true });
  writeFileSync(
    join(dir, 'theme', 'tokens.ts'),
    [
      "import { tokens } from '@reference-ui/neo'",
      '',
      'tokens({',
      '  colors: {',
      "    brand: { value: '#7c3aed' },",
      '  },',
      '})',
      '',
    ].join('\n')
  );
  writeFileSync(
    join(dir, 'theme', 'warn.ts'),
    [
      "import { css } from '@reference-ui/react'",
      '',
      'export const a = css({ display: true })',
      'export const b = css({ display: true })',
      "export const c = css({ color: 'notacolor-xyz' })",
      '',
    ].join('\n')
  );
}

function plantDupSymbolProject(dir: string): void {
  writeFileSync(
    join(dir, 'ui.config.ts'),
    [
      "import { defineConfig } from '@reference-ui/neo'",
      '',
      'export default defineConfig({',
      "  name: 'ref-bin-dup',",
      "  include: ['theme/**/*.{ts,tsx}'],",
      '})',
      '',
    ].join('\n')
  );
  mkdirSync(join(dir, 'theme'), { recursive: true });
  writeFileSync(
    join(dir, 'theme', 'tokens.ts'),
    [
      "import { tokens } from '@reference-ui/neo'",
      '',
      'tokens({',
      '  colors: {',
      "    brand: { value: '#7c3aed' },",
      '  },',
      '})',
      '',
    ].join('\n')
  );
  writeFileSync(
    join(dir, 'theme', 'alpha.ts'),
    ['export interface Shared {', '  alpha: string', '}', ''].join('\n')
  );
  writeFileSync(
    join(dir, 'theme', 'beta.ts'),
    ['export interface Shared {', '  beta: number', '}', ''].join('\n')
  );
}
