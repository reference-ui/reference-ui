// discovery.spec.ts — spec for NEO-SYNC-15, the traced-publish case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// artifact, utility, ghost, unpainted node, or drifted byte on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface JsxElementsArtifact {
  primitives: string[];
  upstream: string[];
  local: string[];
  merged: string[];
}

interface CompileRequest {
  schemaVersion: number;
  spec: unknown;
  jsxHosts: string[];
  sourceRoot: string;
  declarationRoot: string;
  include: string[];
}

// Discovery reaches the publish, never the request: the jsx artifact pins
// local/merged to the traced Card, the portable system carries it, the
// frozen request holds primitives only, the sheet mints exactly the Card
// utility, the card paints, the probes stay classless, and a resync moves
// no discovery byte.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as JsxElementsArtifact;
  assert.deepEqual(
    jsx,
    { primitives: [], upstream: [], local: ['Card'], merged: ['Card'] },
    'jsx-elements.json pins the traced Card as the only local host',
  );

  const mod = (await import(
    pathToFileURL(path.join(outDir, 'system', 'baseSystem.mjs')).href
  )) as unknown as { baseSystem: { jsxElements: string[] } };
  assert.deepEqual(
    mod.baseSystem.jsxElements,
    ['Card'],
    'baseSystem.jsxElements carries the traced Card',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'compile-request.json'), 'utf8'),
  ) as CompileRequest;
  assert.deepEqual(
    Object.keys(request),
    ['schemaVersion', 'spec', 'jsxHosts', 'sourceRoot', 'declarationRoot', 'include'],
    'compile-request.json keeps exactly the frozen six keys',
  );
  const reactTypes = fs.readFileSync(path.join(outDir, 'react', 'react.d.mts'), 'utf8');
  const generated = [...reactTypes.matchAll(/export declare const (\w+): \(props: \w+Props/g)].map(
    (m) => m[1] as string,
  );
  assert.ok(generated.length >= 100, `generated types name the primitive set, got ${generated.length}`);
  assert.deepEqual(
    request.jsxHosts,
    [...new Set(generated)].sort(),
    'request jsxHosts holds primitives only: discovery is not in the request',
  );

  const styles = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-sync15__p_1r {'), 'sheet carries the Card padding utility');
  assert.ok(!styles.includes('c_red'), 'no Random color ghost reaches the sheet');
  const utilityCount = styles.match(/\.neo-sync15__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the Card utility, got ${utilityCount}`);

  const card = page.locator('#card');
  await card.waitFor();
  assert.ok(
    (await card.evaluate((el) => (el as HTMLElement).className)).split(' ').includes('neo-sync15__p_1r'),
    'the forwarded node carries the Card class',
  );
  assert.equal(
    await card.evaluate((el) => getComputedStyle(el).paddingTop),
    '4px',
    'the forwarded node paints the Card padding',
  );
  for (const id of ['random', 'label']) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    assert.equal(
      await probe.evaluate((el) => (el as HTMLElement).className),
      '',
      `#${id} carries no class`,
    );
  }

  const discoveryFiles = [
    path.join('system', 'jsx-elements.json'),
    path.join('system', 'baseSystem.mjs'),
    path.join('system', 'compile-request.json'),
    path.join('styled', 'styles.css'),
  ];
  const before = discoveryFiles.map((file) => fs.readFileSync(path.join(outDir, file), 'utf8'));
  await sync(c.worldDir);
  discoveryFiles.forEach((file, index) => {
    assert.equal(
      fs.readFileSync(path.join(outDir, file), 'utf8'),
      before[index] as string,
      `a second sync leaves ${file} byte-equal`,
    );
  });
}
