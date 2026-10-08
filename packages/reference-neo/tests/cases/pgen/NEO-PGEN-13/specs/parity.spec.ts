// parity.spec.ts — spec for NEO-PGEN-13, the prop-name parity case. Takes
// { case } from the runner and asserts node-side: the vendored E1 prop names,
// the live typegen napi names, and the E4 StylePropName union carry the same
// key set, aliases resolve inside it, and the E1 key set binds through the
// E2 seam. Emits nothing on success; throws naming the drifted key, then
// proves the diff itself by tripping it with corrupted copies.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  assertDetectsDrift,
  assertSetsEqual,
  parseRustStringBlock,
  readCanonSource,
  readShelfDts,
  readShelfVocabulary,
} from '../../shared/parity.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The live typegen vocabulary over napi: prop names, value domains, named
// conditions, the alias map, and the dialect keys. Imported dynamically and
// narrowed structurally, since the entry's declaration graph does not expose
// the member to a static import under the package module resolution.
interface TypegenVocabulary {
  props: string[];
  domains: Record<string, string>;
  conditions: string[];
  aliases: Record<string, string>;
  dialect: string[];
}

async function readLiveVocabulary(): Promise<TypegenVocabulary> {
  const typegen = (await import('@reference-ui/rust/typegen')) as unknown as {
    primitivesVocabulary: () => TypegenVocabulary;
  };
  assert.equal(typeof typegen.primitivesVocabulary, 'function', 'typegen exposes primitivesVocabulary');
  return typegen.primitivesVocabulary();
}

// E4's StylePropName union is printed on one semicolon-free line; the spec
// extracts every quoted member from that line so the type-level key set joins
// the parity triangle as read text. A multi-line reformat yields a partial
// read, which the parity assert below fails loud instead of passing thin.
function parseStylePropUnion(dts: string): string[] {
  const line = dts.split('\n').find((text) => text.startsWith('export type StylePropName = '));
  assert.ok(line, 'E4 declares the StylePropName union on one line');
  const names: string[] = [];
  for (const member of line.matchAll(/"([^"]+)"/g)) names.push(member[1]);
  assert.ok(names.length > 0, 'the StylePropName union carries quoted members');
  return names;
}

// The seam leg: the E1 key set binds through configurePrimitives today,
// returning one bound component per roster name. Binding never renders —
// the stub css throws if anything touches it — so this proves the bind
// path accepts the shelf's keys while render behavior waits on W4.
async function assertSeamBinds(jsxNames: readonly string[], stylePropNames: readonly string[]): Promise<void> {
  const entry = (await import('@reference-ui/rust/primitives')) as unknown as Record<string, unknown>;
  const raw = entry['configurePrimitives'];
  assert.equal(typeof raw, 'function', 'E2 exposes the configurePrimitives seam');
  const configure = raw as unknown as (options: {
    layerName: string;
    stylePropNames: readonly string[];
    css: () => never;
  }) => Record<string, unknown>;
  const bound = configure({
    layerName: 'neo-pgen-13',
    stylePropNames,
    css: () => {
      throw new Error('[pgen-13] the seam probe never renders');
    },
  });
  assertSetsEqual('bound roster vs E1 jsx', jsxNames, Object.keys(bound));
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-13', 'spec runs under its own case id');
  const shelf = readShelfVocabulary();
  const live = await readLiveVocabulary();
  const union = parseStylePropUnion(readShelfDts());

  assertSetsEqual('E1 stylePropNames vs live typegen props', live.props, shelf.stylePropNames);
  assertSetsEqual('E4 StylePropName union vs E1 stylePropNames', shelf.stylePropNames, union);
  assertSetsEqual('E1 conditions vs live typegen conditions', live.conditions, shelf.conditions);

  const named = parseRustStringBlock(readCanonSource('conditions.rs'), 'conditions.rs', 'pub const NAMED_CONDITIONS');
  assertSetsEqual('live typegen conditions vs canon NAMED_CONDITIONS', named, live.conditions);

  assert.deepEqual(shelf.aliases, live.aliases, 'E1 aliases equal the live typegen alias map');
  assert.equal(shelf.aliases['bg'], 'background', 'the bg alias resolves to background');
  assert.equal(shelf.aliases['mt'], 'marginTop', 'the mt alias resolves to marginTop');
  const props = new Set(shelf.stylePropNames);
  for (const [alias, target] of Object.entries(shelf.aliases)) {
    assert.ok(props.has(alias), `alias ${alias} is itself a style prop`);
    assert.ok(props.has(target), `alias ${alias} targets the known prop ${target}`);
  }

  await assertSeamBinds(
    shelf.elements.map((el) => el.jsx),
    shelf.stylePropNames,
  );

  assertDetectsDrift(
    'E1-vs-typegen',
    live.props,
    shelf.stylePropNames.filter((name) => name !== 'color'),
    'color',
  );
  assertDetectsDrift('E4-union-vs-E1', shelf.stylePropNames, [...union, 'bogusProp'], 'bogusProp');
}
