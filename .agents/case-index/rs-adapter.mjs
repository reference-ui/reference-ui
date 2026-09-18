// RS module test-surface adapter for the agent-side case index.
//
// RS modules are NOT case dirs: they hold vitest suites (*.test.ts),
// golden case dirs (tests/cases/<ID>/) or golden files (tests/goldens/*),
// fixtures, and Rust crates. The dumbest pattern that fits: ONE index doc
// per module, sourced from that module's README.md. The indexer never
// parses suite internals; it only inventories suite file paths and golden
// ids so searches for a suite or case id still resolve to the owning
// module. There is no metadata sidecar: the README is the index. RS stays
// dumb.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const RS_MODULES_DIR = 'packages/reference-rs/modules';

const ID_PATTERN = /\b(NEO-[A-Z]+-\d+|ATM-[A-Z]+-\d+|TST-[A-Z]+-\d+|rs:[a-z-]+)\b/g;

export function inferRelated(markdown, selfId) {
  // Case/station ids mentioned in the README are the doc's related set.
  // Authors just cite siblings; the index does the linking.
  const out = [];
  const seen = new Set([selfId]);
  for (const m of String(markdown).matchAll(ID_PATTERN)) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

function firstHeading(markdown) {
  for (const line of markdown.split('\n')) {
    const m = line.match(/^#\s+(.+)/);
    if (m) return m[1].trim();
  }
  return '';
}

export function firstParagraph(markdown, maxLen = 180) {
  // First prose paragraph after any leading headings: the doc's display
  // description. Collapsed to one line and truncated with an ellipsis.
  const lines = String(markdown).split('\n');
  const para = [];
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!started) {
      if (!t || t.startsWith('#')) continue;
      started = true;
    }
    if (!t) break;
    if (t.startsWith('#') || t.startsWith('|') || t.startsWith('```')) break;
    para.push(t);
  }
  let s = para.join(' ').replace(/\s+/g, ' ').trim();
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…';
  return s;
}

// Dirs that never hold authorial suites: vendored deps, build output,
// VCS metadata. Golden case dirs (tests/cases/*) are inventoried, not
// walked — their spec.ts files are fixtures, not suites.
const SKIP_DIRS = new Set(['node_modules', 'dist', 'target', '.git']);

function isCaseDir(full, testsDir) {
  return full === join(testsDir, 'cases');
}

function walkSuites(moduleDir, testsDir) {
  // All vitest suites under the module (some modules keep them under
  // js/ instead of tests/), minus golden case fixtures. Absolute paths.
  const suites = [];
  const stack = [moduleDir];
  while (stack.length) {
    const dir = stack.pop();
    if (isCaseDir(dir, testsDir)) continue;
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) stack.push(full);
      } else if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) {
        suites.push(full);
      }
    }
  }
  return suites.sort();
}

function inventoryCases(testsDir) {
  // Golden case dirs (tests/cases/<ID>/) plus committed golden files
  // (tests/goldens/*) — both are the module's golden inventory. File
  // basenames drop extensions so "tokens.d.ts" indexes as "tokens".
  const ids = [];
  const caseDirs = join(testsDir, 'cases');
  if (existsSync(caseDirs) && statSync(caseDirs).isDirectory()) {
    for (const e of readdirSync(caseDirs).sort()) {
      if (statSync(join(caseDirs, e)).isDirectory()) ids.push(e);
    }
  }
  const goldens = join(testsDir, 'goldens');
  if (existsSync(goldens) && statSync(goldens).isDirectory()) {
    for (const e of readdirSync(goldens).sort()) {
      const full = join(goldens, e);
      if (!statSync(full).isDirectory()) ids.push(e.replace(/\.[^.]+(\.[^.]+)?$/, ''));
    }
  }
  return ids;
}

export function collectRsDocs(root) {
  const modulesDir = join(root, RS_MODULES_DIR);
  const docs = [];
  const hashFiles = [];
  const hashInventory = [];
  for (const name of readdirSync(modulesDir).sort()) {
    const dir = join(modulesDir, name);
    if (!statSync(dir).isDirectory()) continue;
    const readmePath = join(dir, 'README.md');
    const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
    if (existsSync(readmePath)) hashFiles.push(readmePath);
    const testsDir = join(dir, 'tests');
    const suites = walkSuites(dir, testsDir);
    const caseIds = inventoryCases(testsDir);
    // Suite paths and case ids feed the hash (inventory drift rebuilds)
    // but suite contents do not — internals are out of scope.
    const relSuites = suites.map((s) => relative(dir, s));
    hashInventory.push(...relSuites.map((s) => `${name}:suite:${s}`));
    hashInventory.push(...caseIds.map((c) => `${name}:case:${c}`));
    docs.push({
      id: `rs:${name}`,
      kind: 'rs',
      ref: name,
      title: firstHeading(readme) || name,
      description: firstParagraph(readme),
      readme,
      path: relative(root, dir),
      text: readme,
      inventory: [
        `suites: ${relSuites.join(' ')}`,
        `cases(${caseIds.length}): ${caseIds.join(' ')}`,
      ].join('\n'),
      suiteCount: suites.length,
      caseCount: caseIds.length,
      related: inferRelated(readme, `rs:${name}`),
    });
  }
  return { docs, hashFiles, hashInventory };
}
