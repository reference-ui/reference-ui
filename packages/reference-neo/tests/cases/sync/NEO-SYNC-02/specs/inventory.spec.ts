// inventory.spec.ts — spec for NEO-SYNC-02, the §4.1 folder-inventory case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the missing expected path, the surviving
// forbidden path, or the panda needle found in the generated folder on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Landed §4.1 expected paths. The rest lands with its own row: system.mjs
// (SYNC-12), compile-request.json (SYNC-04), runtime-data.d.mts (publish
// follow-up), react.mjs plus styles.css (SYNC-05). The styled declaration
// rows (index, tokens, types/*) landed with TYPE-07.
const EXPECTED_FILES = [
  'system/package.json',
  'system/baseSystem.mjs',
  'system/baseSystem.d.mts',
  'system/evaluated-system.json',
  'system/jsx-elements.json',
  'styled/package.json',
  'styled/styles.css',
  'styled/runtime-data.mjs',
  'styled/index.d.ts',
  'styled/tokens.d.ts',
  'styled/types/index.d.ts',
  'styled/types/conditions.d.ts',
  'styled/types/prop-type.d.ts',
  'styled/types/style-props.d.ts',
  'react/package.json',
  // Post-D5 react filenames (flipped in the D4/D5 migration follow-up).
  'react/react.mjs',
  'react/react.d.mts',
];

// Landed §4.1 forbidden paths (styled/css.mjs pinned since SYNC-13/D4).
const FORBIDDEN_PATHS = [
  'styled/global.css',
  'styled/css.mjs',
  'styled/css',
  'styled/jsx',
  'styled/patterns',
  'styled/recipes',
  'styled/tokens',
  'styled/themes',
  'styled/extensions',
  'virtual',
];

const FORBIDDEN_NEEDLES = ['--made-with-panda', 'data-panda-theme', '@pandacss'];

// Every regular file under dir, recursive. Symlinks never resolve, so a link
// loop cannot hang the walk; dotfiles read as bytes like everything else.
function walkFiles(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile()) out.push(full);
  }
}

// The runner synced this world before serving: the folder shape matches the
// §4.1 inventory on disk, checked node-side without touching the browser.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of EXPECTED_FILES) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `synced folder carries ${file}`);
  }
  for (const file of FORBIDDEN_PATHS) {
    assert.ok(!fs.existsSync(path.join(outDir, file)), `synced folder omits ${file}`);
  }

  const styledEntries = fs.readdirSync(path.join(outDir, 'styled'));
  const helpers = styledEntries.filter((name) => name.startsWith('helpers.'));
  assert.equal(helpers.length, 0, `styled/ carries no helpers module, got ${helpers.join(', ')}`);

  const rootEntries = fs.readdirSync(outDir);
  const pandaConfigs = rootEntries.filter((name) => name.startsWith('panda.config.'));
  assert.equal(pandaConfigs.length, 0, `folder carries no panda config, got ${pandaConfigs.join(', ')}`);

  // Note d: no eval droppings survive under tmp/ — empty or gone entirely.
  // The config evaluator drops its root this slice; the fragments evaluator
  // still mkdirs the empty dir, which a follow-up rmdir removes.
  const tmpDir = path.join(outDir, 'tmp');
  const tmpEntries = fs.existsSync(tmpDir) ? fs.readdirSync(tmpDir) : [];
  assert.equal(tmpEntries.length, 0, `tmp/ carries no eval droppings, got ${tmpEntries.join(', ')}`);

  for (const file of ['system/package.json', 'styled/package.json', 'react/package.json']) {
    const raw = fs.readFileSync(path.join(outDir, file), 'utf8');
    assert.doesNotThrow(() => JSON.parse(raw) as unknown, `${file} parses as JSON`);
  }

  for (const name of ['system', 'styled', 'react']) {
    const link = path.join(c.worldDir, 'node_modules', '@reference-ui', name);
    assert.ok(fs.existsSync(link), `project links @reference-ui/${name}`);
    assert.ok(fs.lstatSync(link).isSymbolicLink(), `@reference-ui/${name} links into the folder`);
  }

  const files = [] as string[];
  walkFiles(outDir, files);
  assert.ok(files.length >= EXPECTED_FILES.length, `folder holds the inventory, got ${files.length} files`);
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const needle of FORBIDDEN_NEEDLES) {
      assert.ok(!text.includes(needle), `${path.relative(outDir, file)} carries no ${needle}`);
    }
  }
}
