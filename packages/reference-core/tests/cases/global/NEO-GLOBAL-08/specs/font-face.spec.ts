// font-face.spec.ts — spec for NEO-GLOBAL-08, the font-face case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// face, the dropped descriptor, or the unpainted family on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface FaceProbe {
  family: string;
  src: string;
  sizeAdjust: string;
  descentOverride: string;
}

// Slice the balanced `{…}` block starting at the given `{` offset, so each
// `@font-face` block is asserted alone and the mono face can prove it carries
// no descent override of its own.
function blockOf(text: string, openBrace: number): string {
  let depth = 0;
  for (let i = openBrace; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(openBrace, i + 1);
    }
  }
  throw new Error('unbalanced block in sheet');
}

function faceBlocks(globalLayer: string): string[] {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const at = globalLayer.indexOf('@font-face', from);
    if (at === -1) return blocks;
    blocks.push(blockOf(globalLayer, globalLayer.indexOf('{', at)));
    from = at + '@font-face'.length;
  }
}

// The world registered a serif face with a two-URL src list plus both metric
// overrides, and a mono face with size-adjust only. The sheet prints both
// faces inside @layer global; the DOM exposes the faces with their
// descriptors; the probes paint the families computed. Whether the binaries
// load is not asserted — only presence and descriptors are.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  const faces = faceBlocks(globalLayer);
  assert.equal(faces.length, 2, `global layer carries two faces, got ${faces.length}`);

  const serif = faces.find((block) => block.includes('font-family: Literata'));
  assert.ok(serif !== undefined, 'global layer carries the Literata face');
  for (const decl of [
    'url(/fonts/literata.woff2) format("woff2")',
    'url(/fonts/literata.woff) format("woff")',
    'font-weight: 200 900',
    'font-style: normal',
    'font-display: swap',
    'size-adjust: 104%',
    'descent-override: 47%',
  ]) {
    assert.ok(serif.includes(decl), `serif face carries ${decl}, got ${serif}`);
  }

  const mono = faces.find((block) => block.includes('JetBrains Mono'));
  assert.ok(mono !== undefined, 'global layer carries the JetBrains Mono face');
  assert.ok(mono.includes('size-adjust: 101%'), `mono face carries its override, got ${mono}`);
  assert.ok(!mono.includes('descent-override'), `mono face omits descent-override, got ${mono}`);
  assert.equal(
    globalLayer.match(/descent-override/g)?.length ?? 0,
    1,
    'descent-override prints exactly once in the global layer',
  );
  assert.ok(
    globalLayer.includes('.ref-serif { font-family: var(--fonts-serif) }'),
    'serif rule carries the family var',
  );
  assert.ok(
    globalLayer.includes('.ref-mono { font-family: var(--fonts-mono) }'),
    'mono rule carries the family var',
  );

  const probe = page.locator('#serif');
  await probe.waitFor();
  const domFaces = await probe.evaluate(() => {
    const found: FaceProbe[] = [];
    const walk = (rules: CSSRuleList): void => {
      for (const rule of Array.from(rules)) {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          const style = (rule as CSSFontFaceRule).style;
          found.push({
            family: style.getPropertyValue('font-family'),
            src: style.getPropertyValue('src'),
            sizeAdjust: style.getPropertyValue('size-adjust'),
            descentOverride: style.getPropertyValue('descent-override'),
          });
        }
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested !== undefined) walk(nested);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // A cross-origin sheet would throw here; the world serves one
        // same-origin sheet, so this arm stays empty by construction.
      }
    }
    return found;
  });
  const domSerif = domFaces.find((face) => face.family.includes('Literata'));
  assert.ok(domSerif !== undefined, `DOM exposes the Literata face, got ${JSON.stringify(domFaces)}`);
  assert.ok(domSerif.src.includes('/fonts/literata.woff2'), `DOM face keeps the src list, got ${domSerif.src}`);
  assert.equal(domSerif.sizeAdjust, '104%', `DOM face keeps size-adjust, got ${domSerif.sizeAdjust}`);
  assert.equal(domSerif.descentOverride, '47%', `DOM face keeps descent-override, got ${domSerif.descentOverride}`);

  const loaded = await probe.evaluate(() =>
    Array.from(document.fonts).map((face) => face.family.replaceAll('"', '')),
  );
  assert.ok(loaded.includes('Literata'), `document.fonts lists Literata, got ${loaded}`);
  assert.ok(loaded.includes('JetBrains Mono'), `document.fonts lists JetBrains Mono, got ${loaded}`);

  const serifFamily = await probe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(serifFamily.includes('Literata'), `serif probe paints the family, got ${serifFamily}`);
  const monoProbe = page.locator('#mono');
  await monoProbe.waitFor();
  const monoFamily = await monoProbe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(monoFamily.includes('JetBrains Mono'), `mono probe paints the family, got ${monoFamily}`);
}
