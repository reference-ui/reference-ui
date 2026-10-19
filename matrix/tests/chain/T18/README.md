# chain-t18 — Ownership: a tag imported from a package is never an own host

Prover for the component-ownership plan (`.claude/plans/component-ownership.md`,
§4 and §9): a style prop on a component that renders through **another
package's bundled runtime** is backed under that package's system name, never
under the app's, whatever the tag is called and however it reaches the file.
Nothing configures `jsxElements`; ownership comes from provenance alone.

## Topology

```
@reference-ui/lib ──────────────────▶ extend ──┐   (lib itself layers icons)
@fixtures/primitive-named-library ──▶ extend ──┼──▶ chain-t18 (user space)
@reference-ui/icons ────────────────▶ layer  ──┘
```

`@fixtures/primitive-named-library` is a third-party package built on
Reference UI: it exports the generated `Button` primitive bound to its own
name, `Tile` (forwards style props, published in `jsxElements`) and `Chip`
(owns `size`, published in `jsxOwned`). Extending it sends its published
names with the compile request apart from the app's own hosts
(`upstreamHosts`); the name-based gate this tier was written against merged
them into the host roster and tripped on them. Icons are composed directly in
`layers` (plan §9.5), which adds the `reference-icons` qualifier and its CSS,
not hosts.

## Probes

One source file per import shape, each with its own novel consumer token
(`src/tokens.ts`), so one probe's rules never back another's class. The
renderer is the package whose runtime draws the probe (`renderer` in
`src/probe.ts`); its published streams are the only systems allowed to back
the probe's stem.

| File | Shape | Runtime prefix | Renderer's systems | Before provenance |
| --- | --- | --- | --- | --- |
| `lib-button.tsx` | `import { Button } from '@reference-ui/lib/primitives'` | `reference-ui__` | lib: `reference-icons`, `reference-ui` | pass |
| `namespace-button.tsx` | `import * as Acme from '@fixtures/…'; <Acme.Button>` | `primitive-named-library__` | `primitive-named-library` | pass |
| `icon.tsx` | `ContentCopyIcon` from `@reference-ui/icons`, icons composed | `reference-icons__` | `reference-icons` | pass |
| `chip.tsx` | `<Chip size="lg">`: owned prop, no class, no rule, no miss | none | none | pass |
| `acme-button.tsx` | `import { Button } from '@fixtures/primitive-named-library'` | `primitive-named-library__` | `primitive-named-library` | red (probe 1) |
| `ui/index.ts` + `barrel-button.tsx` | relative barrel re-exporting lib's `Button` | `reference-ui__` | lib: `reference-icons`, `reference-ui` | red (probe 2) |
| `wrapper-button.tsx` | same-file `css` wrapper around lib's `Button` | `reference-ui__` | lib: `reference-icons`, `reference-ui` | red (probe 3) |
| `tile.tsx` | `<Tile padding>`, a published `jsxElements` name | `primitive-named-library__` | `primitive-named-library` | red (probe 1b) |

Lib publishes two streams because it layers icons, so a lib tag is backed
under both (styling-across-packages plan §3: the price of not following lib's
d.ts re-exports); every other renderer names one system.

Before provenance the red probes were backed only as `chain-t18__<stem>`, so
the runtime class (`primitive-named-library__c_t18AcmeInk`, …) was unbacked,
painted nothing and logged `no compiled class`; the wrapper also drew three
misleading `ATM-W-MISSING-STYLE-PLAN` warnings at sync. All of them pass now.

## Composition legs (sync level)

`tests/unit/icons-composition.test.ts` syncs three tiny projects with the
installed `ref sync <dir> --json`:

- `tests/sync/backed` layers `@reference-ui/icons/baseSystem`: the sheet backs
  `.reference-icons__c_t18BackedInk` and nothing warns (pass).
- `tests/sync/unbacked` composes nothing: sync must still succeed (pass), the
  unstyled icon draws no warning (pass), and the styled icon must warn
  `ATM-W-EXTERNAL-UNBACKED` once, at its line, naming `@reference-ui/icons`
  (before plan S3 the batch was `[]`, the silent failure of plan probe 4).
- `tests/sync/partial` is the app's partly-composed twin
  (styling-across-packages plan gap 2, slice S6): it extends lib but not the
  fixture, and styles the fixture's `<Tile padding>` and `<Button color>`
  beside lib's `<Button color>`. Each fixture tag warns
  `ATM-W-EXTERNAL-UNBACKED` once, at its line, naming
  `'@fixtures/primitive-named-library'`, its system `'primitive-named-library'`
  and the fix `@fixtures/primitive-named-library/baseSystem`; nothing else
  warns. Their stems are backed under no prefix at all (no spray under lib's
  systems or the app's), though their tokens compile. The lib tag is the
  control: backed under lib's systems only. Before plan S2 the fixture props
  were sprayed under every composed system and nothing warned.

## Contract

1. Each probe's runtime mints its own system's class (pins that any
   backing failure is the compile half).
2. The sheet backs that exact class for the probe stem, never
   `chain-t18__<stem>`, and the element computes the consumer token.
3. Every class under the root has a backing rule; zero `no compiled class`
   warnings during render.
4. Probe tokens are absent from every published sheet (novelty).
5. Every class on the probes that passed before provenance is backed, and
   every runtime miss names a provenance probe's stem (the red-tier guard).
6. No spray (styling-across-packages plan S2, checked since S6): each probe
   stem is backed only under its renderer's published streams, never under
   another composed system and never under `chain-t18__`. Before S2,
   `t18AcmeInk` was also emitted under `reference-ui__` and
   `reference-icons__`.

## Red tier and the flip

The tier was written red: the provenance tests were marked expected-fail
(`test.fail` in Playwright, `it.fails` in vitest), and both runners fail a
marked test that starts passing, so a stale mark cannot hide.

Both flips have landed: `PROVENANCE_LANDED = true` in
`tests/e2e/T18-contract.spec.ts` (plan S1 + S5: the four provenance probes
plus the two root-wide checks, every class backed and zero misses) and
`EXTERNAL_UNBACKED_LANDED = true` in `tests/unit/icons-composition.test.ts`
(plan S3). The probe `status` field in `src/probe.ts` and the contract's
check 5 now only guard against a regression and can go.

## Run

```bash
pnpm agent test --packages=@matrix/chain-t18   # hermetic, packed tarballs
pnpm agent vt matrix/tests/chain/T18            # native unit + sync legs
pnpm agent pw chain/T18                         # native contract
```

Native runs need a fresh `ref sync` first: rebuild the fixture
(`pnpm --filter @fixtures/primitive-named-library run build`) and run
`pnpm agent setup --packages=@matrix/chain-t18 --sync`. A stale
`.reference-ui` is the classic false pass.
