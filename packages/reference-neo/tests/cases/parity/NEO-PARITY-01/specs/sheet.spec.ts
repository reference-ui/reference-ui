// sheet.spec.ts — spec for NEO-PARITY-01, the sheet-shape probes plus the
// dialect guards. Takes { page, case } from the runner with the world freshly
// synced. Emits nothing on success; throws naming the missing sheet rule or
// the forbidden authoring form found in world sources on failure. Every W4
// probe is live: the shape blocks pin each landing's spelling, and the
// dialect guards cover the two remaining out-of-dialect forms (RS-11, RS-17).
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

function readSheet(c: NeoCase): string {
  return fs.readFileSync(path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

function readSources(c: NeoCase): string {
  const srcDir = path.join(c.worldDir, 'src');
  return fs
    .readdirSync(srcDir)
    .sort()
    .map((file) => fs.readFileSync(path.join(srcDir, file), 'utf8'))
    .join('\n');
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const styles = readSheet(c);
  const sources = readSources(c);

  // Layers: the system layer nests the six ranks in order, and the reset
  // carries the reduced-motion important guards.
  assert.ok(styles.includes('@layer neo-parity {'), 'sheet layers under the system name');
  assert.ok(
    styles.includes('@layer reset, global, base, tokens, recipes, utilities;'),
    'sheet declares the six ranks in order',
  );
  assert.ok(styles.includes('prefers-reduced-motion'), 'reset keeps the reduced-motion guard');

  // P3: the primary variant scopes through :where(), and no tag recipe
  // carries a bare [data-variant] attribute selector.
  assert.ok(styles.includes(':where([data-variant="primary"])'), 'sheet scopes the variant through :where()');
  assert.ok(!/\.ref-[a-z-]+\[data-variant=/.test(styles), 'sheet carries zero bare-attr variant selectors');

  // P8 (live: RS-24 landed as ATM-LAYER-11): the fontFace array prints
  // one style-distinguished @font-face per entry, each keeping the
  // lib-shaped size-adjust extra.
  assert.equal(styles.match(/@font-face/g)?.length ?? 0, 2, 'sheet prints two @font-face blocks for the array');
  assert.ok(styles.includes('font-style: normal'), 'first face keeps the normal style');
  assert.ok(styles.includes('font-style: italic'), 'second face keeps the italic style');
  assert.ok(styles.includes('url(/fonts/inter.woff2)'), 'first face keeps its src');
  assert.ok(styles.includes('url(/fonts/inter-italic.woff2)'), 'second face keeps its src');
  assert.ok(styles.includes('size-adjust: 104%'), 'faces keep the size-adjust extra');

  // P4 (live: RS-25 landed as ATM-SHORT-09): the six pair shorthands
  // expand to corner longhands, and no pair non-property survives.
  for (const corner of [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-start-start-radius',
    'border-start-end-radius',
    'border-end-start-radius',
    'border-end-end-radius',
  ]) {
    assert.ok(styles.includes(`${corner}: calc(2 * var(--spacing-root))`), `sheet expands to ${corner}`);
  }
  assert.ok(
    !/border-(top|bottom|left|right|start|end)-radius:/.test(styles),
    'sheet carries zero pair non-properties',
  );

  // P14 (live: RS-22 landed as ATM-SHORT-08): the gradient input emits
  // the clip trio with resolved refs, never the dead property.
  assert.ok(
    styles.includes('background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300))'),
    'sheet resolves the gradient refs into the background image',
  );
  assert.ok(styles.includes('-webkit-background-clip: text'), 'sheet clips the background to the text');
  assert.ok(!/text-gradient:/.test(styles), 'sheet carries no text-gradient non-property');

  // P15 (extraction live: RS-23 landed as ATM-SITE-19): the array prop
  // mints the blue.300 ink utility nothing else authors, and the array
  // form resolves both classes from the runtime plans — the CSS-group
  // runtime-data idiom. Paint is live too: NEO-PRIM-11 carried array css
  // props through the split to css() merge, and probes.spec.ts pins it.
  assert.ok(styles.includes('.neo-parity__c_blue\\.300'), 'sheet mints the array-prop ink utility');
  const dataUrl = pathToFileURL(path.join(c.worldDir, '.reference-ui', 'styled', 'runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const arrayResolved = css([{ color: 'blue.300' }, { backgroundColor: 'red.500' }]);
  assert.ok(
    arrayResolved.includes('neo-parity__c_blue.300'),
    `array form resolves the ink class, got ${arrayResolved}`,
  );
  assert.ok(
    arrayResolved.includes('neo-parity__bg-c_red.500'),
    `array form resolves the field class, got ${arrayResolved}`,
  );

  // P11 positive arm: the sheet composes attribute AND hover on one rule.
  assert.ok(styles.includes('[data-state="open"]:hover'), 'sheet composes attr and hover on one selector');

  // P13 shape: the first-child arm exists in base and under the md query.
  const mdAt = styles.indexOf('@container (min-width: 768px)');
  assert.ok(mdAt > 0, 'sheet carries the md container query');
  assert.ok(styles.includes(':first-child'), 'sheet carries the first-child arm');
  assert.ok(styles.slice(mdAt).includes(':first-child'), 'md query carries the first-child arm');

  // P5 shape (live: RS-15 landed as ATM-COND-19): the mixed arm nests the
  // sm container inside the grid supports rule. The empty query is refused
  // with a warning diagnostic (RS-29 landed as ATM-COND-21), so the sheet
  // carries no bare `@supports {` block; the refused diagnostic itself is
  // not sheet-pinned because sync drops non-error diagnostics (COND-13
  // precedent: reaching this spec proves sync succeeded past the warning).
  const p5At = styles.indexOf('@supports (display: grid)');
  assert.ok(p5At > 0, 'sheet carries the P5 grid supports rule');
  assert.ok(
    styles.indexOf('@container (min-width: 640px)', p5At) > p5At,
    'sheet nests the sm container inside the supports rule',
  );
  assert.ok(!styles.includes('@supports {'), 'sheet carries no bare empty-query supports block');

  // P19 (live: RS-26 landed as ATM-UNIT-03): bare numerics unitize while
  // the unitless-stay props keep their bare values.
  assert.ok(
    styles.includes('#p19 { margin-top: 10px; width: 42px; z-index: 5; line-height: 2 }'),
    'sheet unitizes the numeric pair and keeps the unitless stays bare',
  );

  // P20 (live: RS-27 landed as ATM-LAYER-12): top-level at-rules brace
  // their inner selectors instead of printing braceless single lines.
  assert.ok(
    /@media \(min-width: 1px\) \{\s*#p20 \{/.test(styles),
    'sheet braces the matching top-level media rule',
  );
  assert.ok(
    /@media \(min-width: 99999px\) \{\s*#p20-far \{/.test(styles),
    'sheet braces the far top-level media rule',
  );
  assert.ok(!/@media \([^{]*\) #p/.test(styles), 'sheet carries no braceless top-level media line');

  // P21 (live: RS-28 landed as ATM-LAYER-13): breakpoint keys and
  // conditional values lower through the scale's queries, never as
  // descendant selectors.
  assert.ok(
    styles.includes('#p21 { width: 40px; color: var(--colors-blue-300) }'),
    'sheet prints the P21 base rule with the resolved token',
  );
  assert.ok(
    /@media \(min-width: 1024px\) \{\s*#p21 \{ width: 90px \}/.test(styles),
    'sheet lowers the lg conditional value through its query',
  );
  assert.ok(
    /@media \(min-width: 640px\) \{\s*#p21 \{ font-size: 12px \}/.test(styles),
    'sheet lowers the sm key through its query',
  );
  assert.ok(!/#p21 (width|sm|color) \{/.test(styles), 'sheet carries no P21 descendant garbage');

  // P17 shape: one mix rule over the semantic var, redeclared per island.
  assert.ok(
    styles.includes('color-mix(in srgb, var(--colors-brand) 40%, transparent)'),
    'sheet mixes the semantic var once',
  );
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet redeclares vars on the dark island');

  // F1: the invalid slash passes through verbatim, Panda-identical.
  assert.ok(styles.includes('background: red/abc'), 'sheet passes the invalid slash through');

  // F27/F28: keyframes print in global with the hand-written var, and the
  // animation token resolves the motion fragment by name.
  const globalAt = styles.indexOf('@layer global');
  const framesAt = styles.indexOf('@keyframes fadeIn');
  assert.ok(globalAt >= 0 && framesAt > globalAt, 'keyframes print inside the global layer');
  assert.ok(styles.includes('fadeIn 0.2s ease-out'), 'animation token resolves the keyframes by name');
  assert.ok(styles.includes('color: var(--colors-ink)'), 'keyframes hand-write their var');

  // Twins and compounds: :is() condition twins, the bezel :has() compound
  // with its data-invalid twin, marker, quotes, and the static expansion.
  assert.ok(styles.includes(':is(:hover, [data-hover])'), 'sheet twins hover with data-hover');
  assert.ok(styles.includes(':has([aria-invalid="true"])'), 'sheet keeps the bezel :has() compound');
  assert.ok(styles.includes('[data-invalid]'), 'sheet keeps the data-invalid twin');
  assert.ok(styles.includes('::marker'), 'sheet keeps the list marker');
  assert.ok(styles.includes('201C') && styles.includes('201D'), 'sheet keeps both quote marks');
  assert.ok((styles.match(/bg-c_/g) ?? []).length >= 20, 'static * expands the background atoms');

  // No panda-ism reaches the sheet: the flip reads data-color-mode only.
  assert.ok(!styles.includes('data-panda-theme'), 'sheet never names the retired attribute');
  assert.ok(!styles.includes('panda'), 'sheet never names panda');

  // Dialect guards: the world authors nothing the engine still gaps.
  // P4/P8/P14/P15/P19/P20/P21 are live (RS-22–28 landed, NEO-PRIM-11
  // carried the P15 array form through the split); the general-sibling
  // form cites RS-11 and _file cites RS-17.
  assert.ok(sources.includes('textGradient'), 'sources author the live P14 gradient input');
  assert.ok(/css=\{\[/.test(sources), 'sources author the live P15 array css prop');
  assert.ok(
    /border(Top|Bottom|Left|Right|Start|End)Radius/.test(sources),
    'sources author the live P4 radius pairs',
  );
  assert.ok(!sources.includes('& ~ &'), 'sources author no general sibling (cites RS-11)');
  assert.ok(!sources.includes('_file'), 'sources author no _file (cites RS-17)');
}
