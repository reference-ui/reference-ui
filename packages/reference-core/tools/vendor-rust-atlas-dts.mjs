#!/usr/bin/env node
// Vendor tool for the atlas TypeScript declarations consumed by the Core diagnostics repro suite.
// It takes the dist d.ts closure of @reference-ui/rust/atlas and emits a
// committed copy with explicit NodeNext specifiers, so core typechecks without touching
// reference-rs. Run it explicitly after an RS rebuild; --check verifies freshness.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE_DIR = path.dirname(HERE);
const VENDOR_DIR = path.join(CORE_DIR, 'src', 'native', 'generated', 'atlas');
const TOPS = ['atlas.d.ts'];
const FROM_RE = /from(\s+)(['"])([^'"]+)\2/g;
const IMPORT_RE = /import(\s*\(\s*)(['"])([^'"]+)\2(\s*\))/g;
const REGEN_CMD = 'cd packages/reference-core && node tools/vendor-rust-atlas-dts.mjs';

// Resolve the linked workspace RS package; the dist tree must already be built.
function resolveRust() {
  const pkgFile = path.join(CORE_DIR, 'node_modules', '@reference-ui', 'rust', 'package.json');
  if (!existsSync(pkgFile)) {
    throw new Error(`cannot find the linked @reference-ui/rust at ${pkgFile}; run pnpm install first.`);
  }
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const distDir = path.join(path.dirname(pkgFile), 'dist');
  if (!existsSync(distDir)) {
    throw new Error(`@reference-ui/rust dist is missing at ${distDir}; run pnpm --filter @reference-ui/rust build first.`);
  }
  return { distDir, version: String(pkg.version ?? 'unknown') };
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
function collectClosure(distDir) {
  const seen = new Set();
  const queue = [...TOPS];
  while (queue.length) {
    const rel = queue.pop();
    if (seen.has(rel)) continue;
    const abs = path.join(distDir, rel);
    if (!existsSync(abs)) throw new Error(`atlas closure hit a missing file: dist/${rel}; the RS dist shape moved.`);
    seen.add(rel);
    const text = readFileSync(abs, 'utf8');
    for (const spec of specifiersIn(text)) {
      if (!spec.startsWith('.')) continue;
      queue.push(resolveRelativeSpecifier(distDir, rel, spec).file);
    }
  }
  return [...seen].sort();
}

// Resolve one relative specifier written in dist file `ownerRel` to the d.ts it names and to the explicit NodeNext
// specifier the vendored copy carries. The dist writes either the extensionless form (`./x`, `./dir`) or the explicit
// one (`./x.js`, `./dir/index.js`); both name the same declaration file.
function resolveRelativeSpecifier(distDir, ownerRel, spec) {
  const dir = path.dirname(ownerRel);
  if (spec.endsWith('.js')) {
    const file = path.join(dir, `${spec.slice(0, -'.js'.length)}.d.ts`);
    if (existsSync(path.join(distDir, file))) return { file, specifier: spec };
  } else {
    const file = path.join(dir, `${spec}.d.ts`);
    if (existsSync(path.join(distDir, file))) return { file, specifier: `${spec}.js` };
    const index = path.join(dir, spec, 'index.d.ts');
    if (existsSync(path.join(distDir, index))) return { file: index, specifier: `${spec}/index.js` };
  }
  throw new Error(`unresolvable relative specifier '${spec}' in dist/${ownerRel}; the RS dist shape moved.`);
}

// Rewrite one relative specifier to its explicit NodeNext form; externals pass through.
function rewriteSpecifier(distDir, ownerRel, spec) {
  if (!spec.startsWith('.')) return spec;
  return resolveRelativeSpecifier(distDir, ownerRel, spec).specifier;
}

function rewriteText(distDir, rel, text) {
  let count = 0;
  text = text.replace(new RegExp(FROM_RE), (_m, gap, quote, spec) => {
    const next = rewriteSpecifier(distDir, rel, spec);
    if (next !== spec) count += 1;
    return `from${gap}${quote}${next}${quote}`;
  });
  text = text.replace(new RegExp(IMPORT_RE), (_m, gap, quote, spec, tail) => {
    const next = rewriteSpecifier(distDir, rel, spec);
    if (next !== spec) count += 1;
    return `import${gap}${quote}${next}${quote}${tail}`;
  });
  return { text, count };
}

function headerFor(version, rel) {
  const posix = rel.split(path.sep).join('/');
  return [
    '/**',
    ' * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.',
    ' * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.',
    ' * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.',
    ` * @generated from @reference-ui/rust@${version} dist/${posix}`,
    ` * Regen: ${REGEN_CMD}`,
    ' */',
    '',
    '',
  ].join('\n');
}

function buildVendor(distDir, version) {
  const files = new Map();
  let rewrites = 0;
  for (const rel of collectClosure(distDir)) {
    const raw = readFileSync(path.join(distDir, rel), 'utf8');
    const { text, count } = rewriteText(distDir, rel, raw);
    rewrites += count;
    files.set(rel, headerFor(version, rel) + text);
  }
  return { files, rewrites };
}

function writeVendor(files) {
  rmSync(VENDOR_DIR, { recursive: true, force: true });
  for (const [rel, content] of files) {
    const abs = path.join(VENDOR_DIR, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
}

// Compare the committed tree against a fresh build; returns human-readable drift lines.
function checkVendor(files) {
  const drift = [];
  for (const [rel, content] of files) {
    const abs = path.join(VENDOR_DIR, rel);
    if (!existsSync(abs)) drift.push(`missing: src/native/generated/atlas/${rel}`);
    else if (readFileSync(abs, 'utf8') !== content) drift.push(`stale: src/native/generated/atlas/${rel}`);
  }
  return drift;
}

function main(argv) {
  const check = argv.includes('--check');
  const { distDir, version } = resolveRust();
  const { files, rewrites } = buildVendor(distDir, version);
  if (check) {
    const drift = checkVendor(files);
    if (drift.length) {
      console.error(`atlas vendor drift vs @reference-ui/rust@${version} (${drift.length} files):`);
      for (const line of drift) console.error(`  ${line}`);
      console.error(`Regenerate: ${REGEN_CMD}`);
      return 1;
    }
    console.log(`Vendored atlas d.ts is fresh (@reference-ui/rust@${version}, ${files.size} files).`);
    return 0;
  }
  writeVendor(files);
  console.log(`Vendored ${files.size} atlas declaration files (@reference-ui/rust@${version}, ${rewrites} specifiers).`);
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (err) {
  console.error(`vendor-rust-atlas-dts: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
