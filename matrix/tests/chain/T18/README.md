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
(owns `size`, published in `jsxOwned`). Extending it merges `Button`, `Tile`
and `Chip` into the app's host roster, which is what today's name-based gate
trips on. Icons are composed directly in `layers` (plan §9.5), which adds the
`reference-icons` qualifier and its CSS, not hosts.

## Probes

One source file per import shape, each with its own novel consumer token
(`src/tokens.ts`), so one probe's fan-out never backs another's class.

| File | Shape | Runtime prefix | Today |
| --- | --- | --- | --- |
| `lib-button.tsx` | `import { Button } from '@reference-ui/lib/primitives'` | `reference-ui__` | pass |
| `namespace-button.tsx` | `import * as Acme from '@fixtures/…'; <Acme.Button>` | `primitive-named-library__` | pass |
| `icon.tsx` | `ContentCopyIcon` from `@reference-ui/icons`, icons composed | `reference-icons__` | pass |
| `chip.tsx` | `<Chip size="lg">`: owned prop, no class, no rule, no miss | none | pass |
| `acme-button.tsx` | `import { Button } from '@fixtures/primitive-named-library'` | `primitive-named-library__` | red (probe 1) |
| `ui/index.ts` + `barrel-button.tsx` | relative barrel re-exporting lib's `Button` | `reference-ui__` | red (probe 2) |
| `wrapper-button.tsx` | same-file `css` wrapper around lib's `Button` | `reference-ui__` | red (probe 3) |
| `tile.tsx` | `<Tile padding>`, a published `jsxElements` name | `primitive-named-library__` | red (probe 1b) |

The red probes are backed today only as `chain-t18__<stem>`, so the runtime
class (`primitive-named-library__c_t18AcmeInk`, …) is unbacked, paints nothing
and logs `no compiled class`. The wrapper also draws three misleading
`ATM-W-MISSING-STYLE-PLAN` warnings at sync.

## Icons composition (sync level)

`tests/unit/icons-composition.test.ts` syncs two tiny projects with the
installed `ref sync <dir> --json`:

- `tests/sync/backed` layers `@reference-ui/icons/baseSystem`: the sheet backs
  `.reference-icons__c_t18BackedInk` and nothing warns (pass).
- `tests/sync/unbacked` composes nothing: sync must still succeed (pass), the
  unstyled icon draws no warning (pass), and the styled icon must warn
  `ATM-W-EXTERNAL-UNBACKED` once, at its line, naming `@reference-ui/icons`
  (red: today the batch is `[]`, the silent failure of plan probe 4).

## Contract

1. Each probe's runtime mints its own system's class (passes today; pins
   that every red failure is the compile half).
2. The sheet backs that exact class for the probe stem, never
   `chain-t18__<stem>`, and the element computes the consumer token.
3. Every class under the root has a backing rule; zero `no compiled class`
   warnings during render.
4. Probe tokens are absent from every published sheet (novelty).
5. While the red tier stands: every class on the passing probes is backed,
   and every runtime miss names a red probe's stem.

## Red tier and the flip

The red tests are marked expected-fail (`test.fail` in Playwright,
`it.fails` in vitest): the suite is green while they fail, and both runners
fail a marked test that starts passing, so a stale mark cannot hide.

- After plan S1 + S5 land: set `PROVENANCE_LANDED = true` in
  `tests/e2e/T18-contract.spec.ts`. Flips the four red probe tests plus the
  two root-wide checks (every class backed, zero misses). The probe
  `status` field in `src/probe.ts` can then go.
- After plan S3 lands: set `EXTERNAL_UNBACKED_LANDED = true` in
  `tests/unit/icons-composition.test.ts`.

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
