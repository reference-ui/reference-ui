#!/usr/bin/env node
// Vendor tool for the RS-emitted primitive roster drawn through Neo's native seam.
// It takes the committed E1 vocabulary and E4 raw types from the linked @reference-ui/rust
// module sources and emits the committed shelf under src/native/generated/primitives/, so Neo
// reads canon's roster and typegen's prop names without touching reference-rs. E1 copies
// byte-exact since JSON carries no provenance header; E4 gains the header plus the tasty-style
// NodeNext specifier rewrite, which passes its external imports through today and rewrites any
// relative edge the day one appears. Run it explicitly after re-running the primitives generator.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NEO_DIR = path.dirname(HERE);
const VENDOR_DIR = path.join(NEO_DIR, 'src', 'native', 'generated', 'primitives');
const E1 = 'vocabulary.json';
const E4_TOP = 'primitives.d.ts';
const FROM_RE = /from(\s+)(['"])([^'"]+)\2/g;
const IMPORT_RE = /import(\s*\(\s*)(['"])([^'"]+)\2(\s*\))/g;
const REGEN_CMD =
  'pnpm --filter @reference-ui/rust run primitives && cd packages/reference-neo && node tools/vendor-rust-primitives.mjs';

// Resolve the linked workspace RS package; the generator output must already exist.
function resolveRust() {
  const pkgFile = path.join(NEO_DIR, 'node_modules', '@reference-ui', 'rust', 'package.json');
  if (!existsSync(pkgFile)) {
    throw new Error(`cannot find the linked @reference-ui/rust at ${pkgFile}; run pnpm install first.`);
  }
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const srcDir = path.join(path.dirname(pkgFile), 'modules', 'primitives', 'generated');
  if (!existsSync(path.join(srcDir, E1)) || !existsSync(path.join(srcDir, E4_TOP))) {
    throw new Error(
      `primitives generator output is missing under ${srcDir}; run pnpm --filter @reference-ui/rust run primitives first.`
    );
  }
  return { srcDir, version: String(pkg.version ?? 'unknown') };
}

// Collect every specifier-looking string from import/export-from and import() positions.
function specifiersIn(text) {
  const specs = [];
  for (const re of [new RegExp(FROM_RE), new RegExp(IMPORT_RE)]) {
    for (const m of text.matchAll(re)) specs.push(m[3]);
  }
  return specs;
}

// Breadth-first closure over relative d.ts edges; externals pass through untouched.
function collectClosure(srcDir) {
  const seen = new Set();
  const queue = [E4_TOP];
  while (queue.length) {
    const rel = queue.pop();
    if (seen.has(rel)) continue;
    const abs = path.join(srcDir, rel);
    if (!existsSync(abs)) throw new Error(`primitives closure hit a missing file: generated/${rel}; the RS shape moved.`);
    seen.add(rel);
    const text = readFileSync(abs, 'utf8');
    for (const spec of specifiersIn(text)) {
      if (!spec.startsWith('.')) continue;
      const base = path.join(path.dirname(rel), spec);
      if (existsSync(path.join(srcDir, `${base}.d.ts`))) queue.push(`${base}.d.ts`);
      else if (existsSync(path.join(srcDir, base, 'index.d.ts'))) queue.push(path.join(base, 'index.d.ts'));
      else throw new Error(`unresolvable relative specifier '${spec}' in generated/${rel}; the RS shape moved.`);
    }
  }
  return [...seen].sort();
}

// Rewrite one relative specifier to its explicit NodeNext form; externals pass through.
function rewriteSpecifier(srcDir, ownerRel, spec) {
  if (!spec.startsWith('.')) return spec;
  const base = path.join(path.dirname(ownerRel), spec);
  if (existsSync(path.join(srcDir, `${base}.d.ts`))) return `${spec}.js`;
  if (existsSync(path.join(srcDir, base, 'index.d.ts'))) return `${spec}/index.js`;
  throw new Error(`unresolvable relative specifier '${spec}' in generated/${ownerRel}; the RS shape moved.`);
}

function rewriteText(srcDir, rel, text) {
  let count = 0;
  text = text.replace(new RegExp(FROM_RE), (_m, gap, quote, spec) => {
    const next = rewriteSpecifier(srcDir, rel, spec);
    if (next !== spec) count += 1;
    return `from${gap}${quote}${next}${quote}`;
  });
  text = text.replace(new RegExp(IMPORT_RE), (_m, gap, quote, spec, tail) => {
    const next = rewriteSpecifier(srcDir, rel, spec);
    if (next !== spec) count += 1;
    return `import${gap}${quote}${next}${quote}${tail}`;
  });
  return { text, count };
}

function headerFor(version, rel) {
  const posix = rel.split(path.sep).join('/');
  return [
    '/**',
    ' * Vendored primitives declaration file, mechanically copied from the reference-rs generator output.',
    ' * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.',
    ' * Do not edit this copy; regenerate it with the vendor tool after re-running the primitives generator.',
    ` * @generated from @reference-ui/rust@${version} modules/primitives/generated/${posix}`,
    ` * Regen: ${REGEN_CMD}`,
    ' */',
    '',
    '',
  ].join('\n');
}

function buildVendor(srcDir, version) {
  const files = new Map();
  files.set(E1, readFileSync(path.join(srcDir, E1), 'utf8'));
  let rewrites = 0;
  for (const rel of collectClosure(srcDir)) {
    const raw = readFileSync(path.join(srcDir, rel), 'utf8');
    const { text, count } = rewriteText(srcDir, rel, raw);
    rewrites += count;
    files.set(rel, headerFor(version, rel) + text);
  }
  return { files, rewrites };
}

// Committed vendored payloads only; the authored shelf README is not a payload and never sweeps.
function committedPayloads() {
  if (!existsSync(VENDOR_DIR)) return [];
  return readdirSync(VENDOR_DIR)
    .filter((name) => name.endsWith('.d.ts') || name.endsWith('.json'))
    .sort();
}

function writeVendor(files) {
  mkdirSync(VENDOR_DIR, { recursive: true });
  for (const rel of [...files.keys()].sort()) {
    const abs = path.join(VENDOR_DIR, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, files.get(rel), 'utf8');
  }
  for (const rel of committedPayloads()) {
    if (!files.has(rel)) rmSync(path.join(VENDOR_DIR, rel));
  }
}

// Compare the committed shelf against a fresh build; returns human-readable drift lines.
function checkVendor(files) {
  const drift = [];
  for (const rel of [...files.keys()].sort()) {
    const abs = path.join(VENDOR_DIR, rel);
    if (!existsSync(abs)) drift.push(`missing: src/native/generated/primitives/${rel}`);
    else if (readFileSync(abs, 'utf8') !== files.get(rel))
      drift.push(`stale: src/native/generated/primitives/${rel}`);
  }
  for (const rel of committedPayloads()) {
    if (!files.has(rel)) drift.push(`extra: src/native/generated/primitives/${rel}`);
  }
  return drift;
}

function main(argv) {
  const check = argv.includes('--check');
  const { srcDir, version } = resolveRust();
  const { files, rewrites } = buildVendor(srcDir, version);
  if (check) {
    const drift = checkVendor(files);
    if (drift.length) {
      console.error(`primitives vendor drift vs @reference-ui/rust@${version} (${drift.length} files):`);
      for (const line of drift) console.error(`  ${line}`);
      console.error(`Regenerate: ${REGEN_CMD}`);
      return 1;
    }
    console.log(`Vendored primitives are fresh (@reference-ui/rust@${version}, ${files.size} files).`);
    return 0;
  }
  writeVendor(files);
  console.log(`Vendored ${files.size} primitives files (@reference-ui/rust@${version}, ${rewrites} specifiers).`);
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (err) {
  console.error(`vendor-rust-primitives: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
