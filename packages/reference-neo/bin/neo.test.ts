// Unit tests for the neo bin over temp projects plus arg handling.
// They take temp dirs with fake generated output and assert clean removes
// exactly that output. Sync itself is proven live in case worlds; the bin
// only forwards to the sync the harness already covers.
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const BIN_PATH = fileURLToPath(new URL('./neo.ts', import.meta.url));
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

interface BinRun {
  code: number | null;
  stdout: string;
}

function runBin(args: string[], cwd: string): Promise<BinRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN_PATH, ...args], { cwd, timeout: 120000 }, (err, stdout) => {
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, stdout: String(stdout) });
    });
  });
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-bin-'));
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

describe('neo bin', () => {
  it('prints usage and exits 0 on --help', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['--help'], dir);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('usage: neo <sync|clean> [dir]');
  });

  it('rejects an unknown command with usage and exit 1', async () => {
    const dir = await makeTempDir();
    const run = await runBin(['frobnicate'], dir);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('usage: neo <sync|clean> [dir]');
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
});
