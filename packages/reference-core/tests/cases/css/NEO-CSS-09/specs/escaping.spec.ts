// escaping.spec.ts — spec for NEO-CSS-09, the escaping-grammar case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// unescaped selector, the mismatched DOM class, or the mispainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { css, registerRuntimeData } from '@reference-ui/neo/runtime';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

// Seven values, seven utilities. The sheet selectors escape every special
// character while the DOM classes stay raw, and each probing declaration
// paints its computed value — except content, which has no computed form on
// a plain element, so its DOM class plus its sheet rule carry that shape.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-css9__/g)?.length ?? 0;
  assert.equal(utilityCount, 7, `sheet carries seven utilities, got ${utilityCount}`);
  for (const selector of [
    'mt_1\\.5rem',
    'w_50\\%',
    'p_calc\\(100\\%_-_1rem\\)',
    'aspect-ratio_16_\\/_9',
    'font-family_\\"Inter\\"\\,_sans-serif',
    'content_\\"\\[a\\]\\"',
    'shadow_1px_1px_red\\,_2px_2px_blue',
  ]) {
    assert.ok(styles.includes(`.neo-css9__${selector}`), `sheet carries the escaped selector ${selector}`);
  }

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const dots = css({ marginTop: '1.5rem' });
  const pct = css({ width: '50%' });
  const calc = css({ padding: 'calc(100% - 1rem)' });
  const slash = css({ aspectRatio: '16 / 9' });
  const quotes = css({ fontFamily: '"Inter", sans-serif' });
  const brackets = css({ content: '"[a]"' });
  const commas = css({ boxShadow: '1px 1px red, 2px 2px blue' });
  for (const [name, cls] of Object.entries({ dots, pct, calc, slash, quotes, brackets, commas })) {
    assert.ok(cls.length > 0, `${name} resolves to a class`);
    assert.ok(!cls.includes('\\'), `${name} runtime class stays unescaped, got ${cls}`);
  }
  assert.ok(brackets.includes('content_"[a]"'), `bracket class keeps raw quotes, got ${brackets}`);

  async function classOf(id: string): Promise<string> {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    return probe.evaluate((el) => (el as HTMLElement).className);
  }

  assert.equal(await classOf('dots'), dots, 'dots probe carries the resolved class');
  assert.equal(await classOf('pct'), pct, 'percent probe carries the resolved class');
  assert.equal(await classOf('calc'), calc, 'calc probe carries the resolved class');
  assert.equal(await classOf('slash'), slash, 'slash probe carries the resolved class');
  assert.equal(await classOf('quotes'), quotes, 'quotes probe carries the resolved class');
  assert.equal(await classOf('brackets'), brackets, 'brackets probe carries the resolved class');
  assert.equal(await classOf('commas'), commas, 'commas probe carries the resolved class');

  async function textOf(id: string, prop: 'marginTop' | 'width' | 'paddingTop' | 'aspectRatio' | 'fontFamily' | 'boxShadow'): Promise<string> {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    if (prop === 'marginTop') return probe.evaluate((el) => getComputedStyle(el).marginTop);
    if (prop === 'width') return probe.evaluate((el) => getComputedStyle(el).width);
    if (prop === 'paddingTop') return probe.evaluate((el) => getComputedStyle(el).paddingTop);
    if (prop === 'aspectRatio') return probe.evaluate((el) => getComputedStyle(el).aspectRatio);
    if (prop === 'fontFamily') return probe.evaluate((el) => getComputedStyle(el).fontFamily);
    return probe.evaluate((el) => getComputedStyle(el).boxShadow);
  }

  assert.equal(await textOf('dots', 'marginTop'), '24px', 'dotted rem paints');
  assert.equal(await textOf('pct', 'width'), '100px', 'percent width paints half the wrapper');
  assert.equal(await textOf('calc', 'paddingTop'), '184px', 'calc padding paints wrapper minus rem');
  assert.equal(await textOf('slash', 'aspectRatio'), '16 / 9', 'slashed ratio paints');
  const family = await textOf('quotes', 'fontFamily');
  assert.ok(family.includes('Inter'), `quoted stack paints Inter, got ${family}`);
  const shadow = await textOf('commas', 'boxShadow');
  assert.ok(
    shadow.includes('rgb(255, 0, 0)') && shadow.includes('rgb(0, 0, 255)'),
    `comma shadows paint both colours, got ${shadow}`,
  );
}
