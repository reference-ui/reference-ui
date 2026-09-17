// sheet.spec.ts — spec for NEO-PARITY-01, the sheet-shape probes plus the
// dialect guards. Takes { page, case } from the runner with the world freshly
// synced. Emits nothing on success; throws naming the missing sheet rule or
// the forbidden authoring form found in world sources on failure. Blocked
// probes (P5/P8/P14/P15) assert the world avoids their gapped inputs and cite
// the owning RS row; they prove the avoidance, never the gap.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
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

  // P8 (cites RS-24): the world ships one face per family, so the sheet
  // prints exactly one @font-face with the lib-shaped size-adjust extra.
  // The two-entry array form fails native compile; the RS row owns it.
  assert.equal(styles.match(/@font-face/g)?.length ?? 0, 1, 'sheet prints one @font-face for the one face');
  assert.ok(styles.includes('size-adjust: 104%'), 'face keeps the size-adjust extra');

  // P11 positive arm: the sheet composes attribute AND hover on one rule.
  assert.ok(styles.includes('[data-state="open"]:hover'), 'sheet composes attr and hover on one selector');

  // P13 shape: the first-child arm exists in base and under the md query.
  const mdAt = styles.indexOf('@container (min-width: 768px)');
  assert.ok(mdAt > 0, 'sheet carries the md container query');
  assert.ok(styles.includes(':first-child'), 'sheet carries the first-child arm');
  assert.ok(styles.slice(mdAt).includes(':first-child'), 'md query carries the first-child arm');

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

  // Dialect guards: the world authors nothing the engine gaps. P4 (radius
  // pairs) cites RS-25, P5 (mixed @supports) cites RS-15, P8 (fontFace
  // arrays) cites RS-24, P14 (textGradient) cites RS-22, P15 (array css
  // props) cites RS-23, and the general-sibling form cites RS-11.
  assert.ok(!styles.includes('@supports'), 'sheet keeps no @supports (P5 cites RS-15)');
  assert.ok(!sources.includes('@supports'), 'sources author no @supports (P5 cites RS-15)');
  assert.ok(!sources.includes('textGradient'), 'sources author no textGradient (P14 cites RS-22)');
  assert.ok(!/css=\{\[/.test(sources), 'sources author no array css props (P15 cites RS-23)');
  assert.ok(!sources.includes('& ~ &'), 'sources author no general sibling (cites RS-11)');
  assert.ok(!sources.includes('_file'), 'sources author no _file (cites RS-17)');
  assert.ok(
    !/border(Top|Bottom|Left|Right|Start|End)Radius/.test(sources),
    'sources author no radius pairs (P4 cites RS-25)',
  );
}
