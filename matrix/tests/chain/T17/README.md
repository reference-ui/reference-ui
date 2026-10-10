# chain-t17 — Fan-out: style prebuilt components with consumer style props

Prover for the fan-out contract (`STYLE_PROP_EXTERNAL.md` §8): a **named style
prop** passed to an **external (prebuilt) component** always paints. The
consumer compile keeps the prop on the capitalized non-host JSX tag, resolves
it against the **consumer's** tokens, and emits the deterministic
`<system>__<stem>` class the foreign runtime mints — one group per composed
system — into its own utilities block. T16 stays **frozen** as the
default-path regression; T17 pins the new contract.

## Topology

```
@reference-ui/lib ──▶ extend ──┐   (lib itself layers @reference-ui/icons)
                                ├──▶ chain-t17 (user space)
@fixtures/aliased-host-library ──▶ layer ───┘
```

Identical to T16, so the icons arrive **transitively** through lib's `layers`
(the docs topology). Icons therefore qualify under `reference-icons`, lib's
parts under `reference-ui`, and the fixture under `aliased-host-library`.

## Probes

Novel consumer-local tokens (`src/tokens.ts`) — a color (`t17ProbeInk`,
`rgb(183, 2, 51)`) and a spacing (`t17ProbeGap`, `13px`). The spec proves both
are absent from the published icons/lib/fixture sheets, so a passing paint can
never be a coincidental package-shipped hit.

## Contract

1. A consumer token color paints on a prebuilt icon via **direct import** and
   via **lib re-export**; a raw CSS value (`color="#b70233"`) paints too
   (value-kind split).
2. A prebuilt **root** (`<Field padding="t17ProbeGap">`) receives the spacing.
3. An **override** beats the package default (fixture badge `tone="inherit"`).
4. The `css` prop and a `_hover` condition arm paint through an external
   component; `className` / `style` / native props stay alive (positive
   controls).
5. Zero `no compiled class` warnings; every emitted class has a backing rule.
6. The probe paints via an explicitly **foreign-qualified selector** in the
   loaded sheet (`reference-icons__c_t17ProbeInk`), not just computed paint.
7. **Structured icons accounting**: loaded `reference-icons__` selectors equal
   the icons canonical set ∪ the consumer's own foreign probe stems, exact and
   duplicate-free; no `reference-icons__` rule originates from lib's own entry
   (pins the C-T16 composition strip). `publishedIconsRuleCount`
   exact-equality is retired **in T17 only**.

## Re-sync order (G1 §3 amendment ii)

Rebuild the Rust binding → `ref sync` icons → `ref sync` lib → re-materialize
lib `react.mjs` → republish base systems → matrix
`setup --packages=@matrix/chain-t17 --sync` → run this contract. Native gate
evidence requires a fresh `ref sync` first (`pnpm agent playwright` does not
re-sync; a stale `.reference-ui` is the classic false pass).
