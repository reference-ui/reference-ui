// resolve.spec.ts — spec for NEO-PARITY-03, the consumer specifier census.
// Takes { case } from the runner with the mini-lib world freshly synced; the
// page stays parked because resolution is node-side. Emits nothing on success;
// throws naming the first specifier that fails to resolve from the world, the
// first styled importer found in lib src, or the drifted types count.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The workspace root, found by walking up to the workspace marker so the
// lib census survives case moves. Caps the climb; a missing marker is a
// harness fault, never a census pass.
function workspaceRoot(from: string): string {
  let dir = from;
  for (let depth = 0; depth < 12; depth += 1) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`workspace root not found above ${from}`);
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

function importersOf(libSrc: string, specifier: string): string[] {
  const needle = `from '${specifier}'`;
  return sourceFiles(libSrc).filter((file) => fs.readFileSync(file, 'utf8').includes(needle));
}

// Genuine ESM resolution from inside the world: a probe module lands in the
// world dir (outside include, after sync), resolves each package specifier
// against the linked node_modules, prints the mapping, and is removed.
const PROBE = `const out = {};
for (const s of ['@reference-ui/react', '@reference-ui/system', '@reference-ui/system/baseSystem', '@reference-ui/react/styles.css']) {
  out[s] = import.meta.resolve(s);
}
console.log(JSON.stringify(out));
`;

function runProbe(worldDir: string): Promise<Record<string, string>> {
  const probe = path.join(worldDir, '.resolve-probe.mjs');
  fs.writeFileSync(probe, PROBE);
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [probe], { timeout: 60000 }, (err, stdout, stderr) => {
      fs.rmSync(probe, { force: true });
      if (err) {
        reject(new Error(`resolve probe failed: ${stderr || err.message}`));
        return;
      }
      resolve(JSON.parse(stdout) as Record<string, string>);
    });
  });
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  // Package specifiers resolve through the linked generated packages, and
  // each lands on the exports-mapped file inside this world's folder.
  const packages: Array<[string, string]> = [
    ['@reference-ui/react', path.join(outDir, 'react', 'react.mjs')],
    ['@reference-ui/system', path.join(outDir, 'system', 'system.mjs')],
    ['@reference-ui/system/baseSystem', path.join(outDir, 'system', 'baseSystem.mjs')],
    ['@reference-ui/react/styles.css', path.join(outDir, 'react', 'styles.css')],
  ];
  const resolved = await runProbe(c.worldDir);
  for (const [specifier, target] of packages) {
    assert.ok(typeof resolved[specifier] === 'string', `${specifier} resolves from the world`);
    const landed = fs.realpathSync(fileURLToPath(resolved[specifier] as string));
    assert.equal(landed, fs.realpathSync(target), `${specifier} lands on the generated file`);
  }

  // Path forms: the react subpath inside the generated folder, and the
  // lib-shaped relative re-export resolved from a src/ sibling.
  const subpath = path.join(outDir, 'react', 'styles.css');
  assert.ok(fs.existsSync(subpath), 'react/styles.css resolves from the world');
  const relative = path.resolve(c.worldDir, 'src', '../.reference-ui/system/baseSystem.mjs');
  assert.ok(fs.existsSync(relative), '../.reference-ui/system/baseSystem.mjs resolves from the world');

  // Lib census: styled still has zero src importers; the types caveat is
  // re-checked live (13 at evidence time, 11 at oracle time, bounded now).
  const libSrc = path.join(workspaceRoot(c.worldDir), 'packages', 'reference-lib', 'src');
  assert.ok(fs.existsSync(libSrc), 'lib src exists for the importer census');
  const styled = importersOf(libSrc, '@reference-ui/styled');
  assert.equal(styled.length, 0, `zero @reference-ui/styled lib-src importers, got ${styled.length}`);
  const types = importersOf(libSrc, '@reference-ui/types');
  assert.ok(
    types.length >= 1 && types.length <= 13,
    `D19 types caveat still live and bounded: ${types.length} importers (evidence 13)`,
  );
  const react = importersOf(libSrc, '@reference-ui/react');
  const system = importersOf(libSrc, '@reference-ui/system');
  assert.ok(react.length > 0 && system.length > 0, `lib still consumes react (${react.length}) and system (${system.length})`);
}
