// refusals.spec.ts — spec for CORE-RECIPE-14, the slot-refusal case.
// Takes { case } from the runner with the world UNSYNCED (the hook is off: the world fails by
// design). The case world's unknown slot is asserted node-side; three temp worlds, one refusal
// each, go through expectRefusal, which syncs each and checks its message and that no folder
// survives. Emits nothing on success; throws when a refusal misses its slot, stem, className or
// file:line:column. A failed sync must leave no .reference-ui folder behind, in the case world or
// any temp world.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const RECIPE_IMPORT = "import { recipe } from '@reference-ui/react'";

// The ui.config.ts a temp world syncs with: one system, named for the refusal it provokes.
function configFile(name: string): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    '',
    'export default defineConfig({',
    `  name: '${name}',`,
    "  include: ['src/**/*.{js,ts,tsx}'],",
    '})',
    '',
  ].join('\n');
}

// Syncs a temp world whose src/app.ts is the recipe import plus `lines`, asserts the refusal,
// and removes the world. A failed sync must leave no .reference-ui folder behind.
async function expectRefusal(
  name: string,
  lines: string[],
  refusal: RegExp,
  claim: string,
): Promise<void> {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'core-recipe14-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'ui.config.ts'), configFile(name));
    fs.writeFileSync(path.join(dir, 'src', 'app.ts'), [RECIPE_IMPORT, '', ...lines, ''].join('\n'));
    await assert.rejects(sync(dir), refusal, claim);
    assert.ok(
      !fs.existsSync(path.join(dir, '.reference-ui')),
      `${name}: failed sync leaves no half-written folder behind`,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The case world is served unsynced, so its unknown slot is the refusal under test: the message
// names the slot, the slots the list declares, and file:line:column of the `header` key.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const failure: unknown = await sync(c.worldDir).then(
    () => null,
    (err: unknown) => err,
  );
  assert.ok(failure instanceof Error, "the unknown slot 'header' fails sync");
  const message = failure instanceof Error ? failure.message : String(failure);
  assert.match(
    message,
    /recipe 'panel' styles unknown slot 'header'; its slots are: root, title/,
    'the rejection names the unknown slot and the slots its list declares',
  );
  assert.match(message, /app\.ts:8:\d+/, 'the rejection carries file:line:column of the header key');
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, '.reference-ui')),
    'failed sync leaves no half-written folder behind',
  );

  await expectRefusal(
    'slot-twice',
    [`export const twice = recipe({ className: 'twice', slots: ['root', 'root'] })`],
    /recipe 'twice' lists slot 'root' twice/,
    'a slot listed twice fails sync naming it',
  );
  await expectRefusal(
    'slot-collision',
    [
      `export const card = recipe({ className: 'card', slots: ['root'], base: { root: { display: 'flex' } } })`,
      `export const cardRoot = recipe({ className: 'card__root', base: { display: 'block' } })`,
    ],
    /Recipe class stem 'card__root' within system 'slot-collision' is claimed by slot 'root' of recipe 'card' and recipe 'card__root'/,
    'a plain recipe named like a slot stem fails sync naming both claimants',
  );
  await expectRefusal(
    'slot-shared',
    [
      `export const shared = recipe({ className: 'shared', slots: ['root'] })`,
      `export const sharedPlain = recipe({ className: 'shared', base: { display: 'grid' } })`,
    ],
    /Duplicate recipe className 'shared' within system 'slot-shared'/,
    'a plain and a slotted recipe sharing a className fail sync naming it',
  );
}
