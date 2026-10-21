// slots.spec.ts — spec for CORE-RECIPE-13, the slotted recipe case. Takes { page, case } from the
// runner with the world freshly synced and the page already navigated to it. Emits nothing on
// success; throws naming the missing sheet class, the wrong slot table or class string, or the
// part that does not paint its computed styles.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecLocator, SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { recipe, registerRecipeData, type SlottedRecipeRuntimeFn } from '@reference-ui/core/runtime';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

type Slot = 'root' | 'title' | 'body';
type Card = SlottedRecipeRuntimeFn<Slot>;

const STEM = 'core-recipe__card';
const SLOTS = ['root', 'title', 'body'] as const;

// The authored card definition, mirrored from the world: the compiled tables and this config must
// resolve the same selections, so the spec holds both and proves they agree.
const CONFIG = {
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: {
    root: { display: 'flex', flexDirection: 'column', color: 'ink' },
    title: { fontWeight: '600' },
  },
  variants: {
    size: {
      sm: { root: { padding: '4px' }, title: { fontSize: '12px' } },
      lg: { root: { padding: '16px' }, title: { fontSize: '20px' } },
    },
    tone: {
      quiet: { root: { backgroundColor: 'paper' } },
      loud: { root: { backgroundColor: 'brand' }, title: { color: 'paper' } },
    },
    muted: { true: { body: { opacity: '0.5' } } },
  },
  defaultVariants: { size: 'sm', tone: 'quiet' },
  compoundVariants: [{ size: 'lg', tone: 'loud', css: { title: { letterSpacing: '2px' } } }],
} as const;

// Each slot's variant table: only the axis values that carry styles in that slot, in declaration order.
const VARIANT_MAPS: Record<Slot, Record<string, string[]>> = {
  root: { size: ['sm', 'lg'], tone: ['quiet', 'loud'] },
  title: { size: ['sm', 'lg'], tone: ['loud'] },
  body: { muted: ['true'] },
};

// Closed classes the world's selections emit: a base, a compound, a boolean arm and a responsive arm.
const SHEET_CLASSES = [
  `.${STEM}__root__base`,
  `.${STEM}__title_c_lg_loud`,
  `.${STEM}__body_m_true`,
  '.md\\:core-recipe__card__title_s_lg',
];

// The selections the world paints, keyed by probe prefix. Each is resolved node-side as well.
const SELECTIONS = {
  defaults: {},
  loud: { size: 'lg', tone: 'loud', muted: true },
  picked: { size: 'lg' },
  narrow: { size: { base: 'sm', md: 'lg' } },
  wide: { size: { base: 'sm', md: 'lg' } },
} as const;

interface Painted {
  fontSize: string;
  color: string;
  letterSpacing: string;
  paddingTop: string;
  backgroundColor: string;
  opacity: string;
  fontWeight: string;
}

// The sheet has the recipe layer and each closed class, and no rule for the body base: body carries no base styles.
function checkSheet(styles: string): void {
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  for (const cls of SHEET_CLASSES) {
    assert.ok(styles.includes(cls), `sheet carries ${cls}`);
  }
  assert.ok(!styles.includes(`.${STEM}__body__base`), 'sheet has no rule for the empty body base');
}

// One runtime table per slot, each carrying the variant map its slot styles.
function checkTables(data: RuntimeDataModule): void {
  const tables = data.runtimeData.recipes;
  const keys = Object.keys(tables).filter((k) => k.startsWith(STEM)).sort();
  assert.deepEqual(keys, [`${STEM}__body`, `${STEM}__root`, `${STEM}__title`], 'one runtime table per slot');
  for (const slot of SLOTS) {
    const table = tables[`${STEM}__${slot}`];
    assert.ok(table, `runtime data carries the ${STEM}__${slot} table`);
    assert.deepEqual(table.variantMap, VARIANT_MAPS[slot], `${slot} table carries its variant map`);
  }
}

// The node-side call resolves one class string per slot, raw() merges per slot, and the axis metadata holds.
function checkRuntime(card: Card): void {
  assert.deepEqual(
    card({ size: 'lg', tone: 'loud' }),
    {
      root: `${STEM}__root__base ${STEM}__root_s_lg ${STEM}__root_t_loud`,
      title: `${STEM}__title__base ${STEM}__title_s_lg ${STEM}__title_t_loud ${STEM}__title_c_lg_loud`,
      body: `${STEM}__body__base`,
    },
    'a loud large selection resolves one class string per slot',
  );
  assert.deepEqual(
    card(),
    {
      root: `${STEM}__root__base ${STEM}__root_s_sm ${STEM}__root_t_quiet`,
      title: `${STEM}__title__base ${STEM}__title_s_sm`,
      body: `${STEM}__body__base`,
    },
    'defaults resolve one class string per slot',
  );
  assert.deepEqual(
    card.raw({ size: 'lg', tone: 'loud' }),
    {
      root: { display: 'flex', flexDirection: 'column', color: 'ink', padding: '16px', backgroundColor: 'brand' },
      title: { fontWeight: '600', fontSize: '20px', color: 'paper', letterSpacing: '2px' },
      body: {},
    },
    'raw() merges base, variant and compound styles per slot',
  );
  assert.deepEqual(card.variantKeys, ['size', 'tone', 'muted'], 'variant keys follow declaration order');
  assert.deepEqual(
    card.splitVariantProps({ size: 'lg', id: 'x' }),
    [{ size: 'lg' }, { id: 'x' }],
    'splitVariantProps separates the selection from the rest',
  );
}

async function probe(page: SpecPage, id: string): Promise<SpecLocator> {
  const locator = page.locator(`#${id}`);
  await locator.waitFor();
  return locator;
}

// Each probe carries the slot class strings its selection resolves to; #split carries the title class and the rest.
async function checkDomClasses(page: SpecPage, card: Card): Promise<void> {
  for (const [prefix, selection] of Object.entries(SELECTIONS)) {
    const classes = card(selection);
    for (const slot of SLOTS) {
      const locator = await probe(page, `${prefix}-${slot}`);
      const className = await locator.evaluate((el) => el.className);
      assert.equal(className, classes[slot], `#${prefix}-${slot} carries the ${slot} class string`);
    }
  }
  const split = await probe(page, 'split');
  const splitProbe = await split.evaluate((el) => ({ className: el.className, rest: el.dataset.rest }));
  assert.equal(splitProbe.className, card({ size: 'lg' }).title, '#split carries the title class');
  assert.equal(splitProbe.rest, '{"id":"split"}', '#split carries the rest props');
}

async function painted(page: SpecPage, id: string): Promise<Painted> {
  const locator = await probe(page, id);
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fontSize: style.fontSize,
      color: style.color,
      letterSpacing: style.letterSpacing,
      paddingTop: style.paddingTop,
      backgroundColor: style.backgroundColor,
      opacity: style.opacity,
      fontWeight: style.fontWeight,
    };
  });
}

async function expectPaint(page: SpecPage, id: string, expected: Partial<Painted>): Promise<void> {
  const actual = await painted(page, id);
  for (const key of Object.keys(expected) as (keyof Painted)[]) {
    assert.equal(actual[key], expected[key], `#${id} paints its ${key}`);
  }
}

// The raw-fed title paints the same text styles as the class-fed loud title.
async function checkRawFed(page: SpecPage): Promise<void> {
  const twin = await painted(page, 'loud-title');
  const raw = await painted(page, 'rawfed');
  assert.deepEqual(
    { fontSize: raw.fontSize, color: raw.color, letterSpacing: raw.letterSpacing, fontWeight: raw.fontWeight },
    { fontSize: twin.fontSize, color: twin.color, letterSpacing: twin.letterSpacing, fontWeight: twin.fontWeight },
    '#rawfed paints equal to #loud-title',
  );
}

// Every probe paints the computed styles its selection resolves to, part by part.
async function checkComputed(page: SpecPage): Promise<void> {
  await expectPaint(page, 'loud-root', { paddingTop: '16px', backgroundColor: 'rgb(124, 58, 237)' });
  await expectPaint(page, 'loud-title', {
    fontSize: '20px',
    color: 'rgb(255, 255, 255)',
    letterSpacing: '2px',
    fontWeight: '600',
  });
  await expectPaint(page, 'loud-body', { opacity: '0.5' });
  await expectPaint(page, 'defaults-root', {
    paddingTop: '4px',
    backgroundColor: 'rgb(255, 255, 255)',
    color: 'rgb(17, 17, 17)',
  });
  await expectPaint(page, 'defaults-title', { fontSize: '12px', letterSpacing: 'normal' });
  await expectPaint(page, 'defaults-body', { opacity: '1' });
  await expectPaint(page, 'picked-title', { fontSize: '20px' });
  await expectPaint(page, 'narrow-title', { fontSize: '12px' });
  await expectPaint(page, 'wide-title', { fontSize: '20px' });
  await expectPaint(page, 'narrow-root', { paddingTop: '4px' });
  await expectPaint(page, 'wide-root', { paddingTop: '16px' });
  await expectPaint(page, 'split', { fontSize: '20px' });
  await checkRawFed(page);
}

// The DOM class strings come first, then each part's computed styles.
async function checkPaint(page: SpecPage, card: Card): Promise<void> {
  await checkDomClasses(page, card);
  await checkComputed(page);
}

export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  checkSheet(styles);
  checkTables(data);
  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  const card = recipe(CONFIG);
  checkRuntime(card);
  await checkPaint(page, card);
}
