# chain-t17 — Style prebuilt components with consumer style props

Prover for the consumer-style-prop contract (first written as the fan-out
contract): a **named style prop** passed to a **prebuilt component** from a
composed package always paints. The consumer compile keeps the prop on the
package's tag, resolves it against the **consumer's** tokens, and emits the
deterministic `<system>__<stem>` class the package's runtime mints into its own
utilities block, one `/* foreign <system> */` group for each system the package
renders through (its published streams that the app composes). Which package
renders a tag comes from where its import lands, not from its name
(styling-across-packages plan §3). T16 stays **frozen** as the default-path
regression; T17 pins this contract.

## Topology

```
@reference-ui/lib ──▶ extend ──┐   (lib itself layers @reference-ui/icons)
                                ├──▶ chain-t17 (user space)
@fixtures/aliased-host-library ──▶ layer ───┘
```

Identical to T16, so the icons arrive **transitively** through lib's `layers`
(the docs topology). Icons therefore qualify under `reference-icons`, lib's
parts under `reference-ui`, and the fixture under `aliased-host-library`. A tag
imported from lib backs under both of lib's published streams,
`reference-icons` and `reference-ui`, because the engine reads lib's streams
rather than its re-exports; that is why `<Field padding>` also adds
`reference-icons__p_t17ProbeGap` (contract 7).

## Probes

Novel consumer-local tokens — a color (`t17ProbeInk`,
`rgb(183, 2, 51)`), a spacing (`t17ProbeGap`, `13px`) and a role-split tone
(`t17ProbeTone`, `surface` 12%, `line` 41%). The spec proves the names are
absent from the published icons/lib/fixture sheets, so a passing paint can
never be a coincidental package-shipped hit. The tone is gated by name only,
because lib's published utilities already contain percentages such as `41%`.

The tone probe is `color="t17ProbeInk/t17ProbeTone"` on a prebuilt icon. `color`
is a line-role prop, so its foreign-qualified rule must reference
`--tones-t17-probe-tone-line`, never the surface amount. The icon paints the ink
at 41%, serialised by Chromium as `color(srgb 0.717647 0.00784314 0.2 / 0.41)`.

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
   the icons canonical set ∪ the consumer's own foreign probe stems (the toned
   stem included), exact and duplicate-free; probe classes match as whole class
   names, so `c_t17ProbeInk` never counts the toned `c_t17ProbeInk/t17ProbeTone`
   rule. No `reference-icons__` rule originates from lib's own entry (pins the
   C-T16 composition strip). `publishedIconsRuleCount` exact-equality is retired
   **in T17 only**.
8. A consumer tone resolves against the consumer's tokens in the consumer compile: the
   `color` probe paints the ink at the line amount, and its rule references
   `--tones-t17-probe-tone-line` and never `--tones-t17-probe-tone-surface`.

## Re-sync order (G1 §3 amendment ii)

Rebuild the Rust binding → `ref sync` icons → `ref sync` lib → re-materialize
the lib React runtime → republish base systems → re-sync this suite
(`setup --packages=@matrix/chain-t17 --sync`) → run this contract. Native gate
evidence requires a fresh `ref sync` first (`pnpm agent playwright` does not
re-sync; a stale `.reference-ui` is the classic false pass).
