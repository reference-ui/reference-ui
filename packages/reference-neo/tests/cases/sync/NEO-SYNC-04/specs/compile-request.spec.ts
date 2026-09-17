// compile-request.spec.ts — spec for NEO-SYNC-04, the frozen request case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the compile-request key, host, byte,
// or merged-content pin that drifts from the frozen contract on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const CONFIG_HOSTS = ['CardFrame', 'PanelShell'];

// The runner synced this world before serving: compile-request.json carries
// exactly the six frozen keys with the bytes sync() sent, jsxHosts unions
// the config hosts with the generated primitives, and jsx-elements.json pins
// the merged multi-host content (coverage-map note a).
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const requestPath = path.join(outDir, 'system', 'compile-request.json');
  assert.ok(fs.existsSync(requestPath), 'synced folder carries system/compile-request.json');

  const raw = fs.readFileSync(requestPath, 'utf8');
  const parsed = JSON.parse(raw) as {
    schemaVersion: number;
    spec: unknown;
    jsxHosts: string[];
    sourceRoot: string;
    declarationRoot: string;
    include: string[];
  };
  assert.deepEqual(
    Object.keys(parsed),
    ['schemaVersion', 'spec', 'jsxHosts', 'sourceRoot', 'declarationRoot', 'include'],
    'compile-request.json keys are exactly the frozen six',
  );

  // Primitives read back from the generated types, not from neo source: the
  // per-tag declares are what generate.ts emitted for this very sync.
  const reactTypes = fs.readFileSync(path.join(outDir, 'react', 'react.d.mts'), 'utf8');
  const generated = [...reactTypes.matchAll(/export declare const (\w+): \(props: \w+Props/g)].map(
    (m) => m[1] as string,
  );
  assert.ok(generated.length >= 100, `generated types name the primitive set, got ${generated.length}`);
  for (const name of ['Div', 'Span', 'Obj', 'Var']) {
    assert.ok(generated.includes(name), `generated primitives include ${name}`);
  }
  const expectedHosts = [...new Set([...CONFIG_HOSTS, ...generated])].sort();
  assert.deepEqual(
    parsed.jsxHosts,
    expectedHosts,
    'jsxHosts equals config jsxElements plus the generated primitives',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as unknown;
  const expected = {
    schemaVersion: 1,
    spec: evaluated,
    jsxHosts: expectedHosts,
    sourceRoot: c.worldDir,
    declarationRoot: c.worldDir,
    include: ['theme/**/*.{ts,tsx}'],
  };
  assert.deepEqual(parsed, expected, 'compile-request.json equals the frozen request sent');
  assert.equal(
    raw,
    `${JSON.stringify(expected, null, 2)}\n`,
    'compile-request.json bytes equal the sent serialization',
  );

  const jsxElements = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as { primitives: string[]; upstream: string[]; local: string[]; merged: string[] };
  assert.deepEqual(
    jsxElements,
    { primitives: [], upstream: [], local: CONFIG_HOSTS, merged: CONFIG_HOSTS },
    'jsx-elements.json pins the merged multi-host content',
  );

  const sheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(
    sheet.includes('neo-sync04__c_brand'),
    'frozen sourceRoot scan extracted the world want',
  );
}
