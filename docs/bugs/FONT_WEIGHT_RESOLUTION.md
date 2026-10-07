# Font Weight Should Resolve Against the Selected Family

**Status:** Fixed 2026-10-07 — bare weights resolve against the active family
**Owner:** landed in `reference-rs` `atomic` (`resolve/font/scope.rs`)
**Date:** 2026-10-07
**Scope:** the `font()` subsystem and the atomic `font` / `weight` dialect
**Related:** `CSS_COMPOSITION_INVESTIGATION.md` (another "emitted but not wired"
class of bug in the same pipeline)

> This note records the **original design intent** (per the design owner) next to
> the **former behaviour**, and marks where they diverged. The divergence below
> is now closed by the fix in §0; the rest is kept as the design record.

---

## 0. Resolution (2026-10-07)

Fixed at extract time, not in the resolver: each style root (JSX element,
`css()` call, recipe block, global rule) rewrites bare keyword weights to
`family.name` form when the root names exactly one family
(`packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`).
`lower_weight` and `FontScale` are untouched, so all pre-existing resolve
behaviour — including the keyword fallback and the `test_bare_weight_uses_*`
pins — stands.

Deliberate boundaries, all covered by tests:

- **Wants only; plans stay bare.** Runtime plan keys carry no family
  dimension, so authored plans keep keyword values and dynamic lookups
  behave exactly as before. The diagnostics proof join stays green with no
  analysis-mirror change (verified: zero new warnings on the touched cases).
- **Static/dynamic split.** Static `weight="thin"` beside `font="sans"`
  now renders 200; dynamic `weight={x}` keeps keyword semantics. The
  explicit `sans.thin` form works on both paths. Family-aware harvest is
  follow-up work, not part of this fix.
- **Conflicts decline to guess.** Two families in one scope, non-key
  family values (stacks), dotted/numeric/unknown weight names, and
  conditional/nested global values all keep today's behaviour.

Proof: 9 `scope` unit tests, JSX + `css()` + TSX-recipe + spec-recipe
compile tests, `ATM-COND-05` (sans 200 / serif 373 / mono 393) and
`ATM-LAYER-15` (global rule) seam specs. Full `agentrs t` green, quality
0 violations. User docs: System > Fonts (`/fonts`).

---

## TL;DR

Fonts are a first-class subsystem: each family defines its **own** named weight
scale, so `weight="thin" | "normal" | …` is meant to resolve **against the
family you selected** — pick `sans`, and `thin` means *sans thin* (200); pick
`serif`, and `normal` means *serif normal* (373).

Today that is only half true:

- `font="sans"` **does** apply the family's default weight (from that family's
  scale) — family-aware.
- but an explicit `weight="thin"` **ignores the family entirely** and falls back
  to a hardcoded CSS keyword table (`thin → 100`, `normal → 400`, …).

So the per-family scales are collected, tokenised, and emitted — yet an explicit
`weight` name never consults them. The family-relative ergonomics that justify
fonts being its own subsystem do not work through the one prop authors reach for.

---

## 1. The subsystem as it exists

`font()` fragments define a family once (`packages/reference-lib/src/core/theme/fonts.ts`):

```ts
font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: { src: '…inter…woff2', fontWeight: '100 900', fontDisplay: 'swap' },
  weights: { thin: '200', light: '300', normal: '400', semibold: '600', bold: '700', black: '900' },
  css: { letterSpacing: '-0.01em', fontWeight: 'normal' },
})
```

Note the per-family oddities that only make sense as custom scales:

- `sans.thin = 200` (fonts.ts:13)
- `serif.normal = 373` (fonts.ts:38)
- `mono.normal = 393` (fonts.ts:60)

These are ingested into `FontScale` (`packages/reference-rs/modules/base-system/src/fonts.rs`):

- `FontDefinition { value, weights, css, font_face }` (fonts.rs:42-51)
- `scoped_weight("sans.bold") -> "700"` — **requires a `family.name` dotted key**
  (fonts.rs:114-121)
- `generic()` seeds CSS-generic families with the keyword table
  (fonts.rs:13-20, 81-87, 124-135)

Two independent atomic transforms consume the scale
(`packages/reference-rs/modules/atomic/src/resolve/font/`):

- `family.rs` — `lower_font(name)` stamps `fontFamily`, then the family's
  **default** weight and css extras. Default weight chain:
  `css.fontWeight → weights.normal → 400` (family.rs:38-45). **Family-aware.**
- `weight.rs` — `lower_weight(raw)` resolves an explicit weight:
  `scoped_weight(raw)` → `css_weight_keyword(raw)` → `raw` (weight.rs:19-26).
  The keyword table is hardcoded (weight.rs:9-16):
  `thin 100 / light 300 / normal 400 / semibold 600 / bold 700 / black 900`.

`mod.rs` frames these as **one subsystem** ("`font` and `weight` as one
subsystem, matching core's font transform"). Yet the two transforms do not share
the selected family at all.

---

## 2. Intended design (per the design owner)

- You choose a family.
- That family defines its own weight vocabulary (`thin`, `normal`, …).
- `weight="thin"` then means **that family's thin**, not a global constant.
- Fonts are a subsystem precisely so a family is a self-contained typographic
  scale — weight names are relative to the family, the way `normal` differs
  between Inter and Literata by design.

Under this model, the CSS-keyword table is a **fallback for un-registered /
generic families**, not the primary resolution for a family that defines the
name.

---

## 3. Current behaviour (observed + codified)

Observed in the docs (`/typography`, `WeightRamp` using `font="sans"` +
bare names):

| author writes | family scale says | renders | class |
| --- | --- | --- | --- |
| `weight="thin"` | sans thin = **200** | **100** | `font-weight_100` |
| `weight="normal"` | sans normal = 400 | 400 | `font-weight_400` |
| `weight="semibold"` | sans semibold = 600 | 600 | `font-weight_600` |
| `weight="bold"` | sans bold = 700 | 700 | `font-weight_700` |

For `serif`/`mono`, `weight="normal"` would render `400`, not the authored
`373`/`393`. No `font-weight_200`, `_373`, or `_393` utility exists in the docs
stylesheet at all.

This is **codified by tests**, i.e. it is current behaviour, not an accident:

- `test_bare_weight_uses_css_keywords` — `lower_weight("bold") → 700`
  (resolve/font/tests.rs:49-53)
- `test_ingested_font_css_and_scoped_weight` — only `"sans.bold"` (dotted)
  reaches the scale (tests.rs:19-47)

### The internal inconsistency is the tell

- `font="sans"` alone → weight comes from **sans** (`weights.normal` / the
  family's `css.fontWeight`). Family-aware.
- `font="sans" weight="normal"` → weight comes from the **keyword table**
  (`400`), the family scale is bypassed.

A family-relative default that is overridden by a family-agnostic explicit value
is the shape of the divergence. The explicit path is the one that's wrong.

---

## 4. Root cause

`lower_weight` has **no access to the active family**. It receives only the raw
string and the `FontScale`, so it cannot know that `font="sans"` is in play. The
only way it can reach a family scale is the fully-qualified `family.name` form.
When no dotted key is present it immediately falls to the hardcoded keyword
table, which shadows every registered family that defines the same name.

Equivalently: `scoped_weight` is the *only* family-aware lookup, and it requires
the author to write the family a second time.

---

## 5. How it should work (proposed)

Resolution of an explicit `weight` name should be family-aware, with a clear
precedence:

1. **Explicit family scope:** `weight="sans.thin"` → `sans.thin` (keep for
   disambiguation / cross-family use).
2. **Active family:** if the same style object selects a family
   (`font="sans"` or `fontFamily`), resolve bare `weight="thin"` against that
   family's `weights` map.
3. **CSS keyword fallback:** only when the active family is absent or does not
   define the name.
4. **Raw value:** `weight="393"` passes through.

Implementation shape (for the owning agent, not done here):

- Add a `FontScale` query for the active family, e.g.
  `weight(family, name) -> Option<&str>` (thin wrapper over the existing
  `weights` map; `scoped_weight` stays).
- Thread the selected family into `lower_weight` — the atomic resolve step must
  see the sibling `font` / `fontFamily` of the same style object. If the resolve
  pipeline transforms properties independently, `family` and `weight` may need to
  be co-resolved (they are already one subsystem per `mod.rs`).
- Keep `generic()` families working: their `weights` are the keyword table, so
  fallback order is naturally preserved.

This removes the need for docs/marketing to ever write `sans.thin`, and restores
the "pick a family, weights are relative" contract.

---

## 6. Edge cases to settle

- **`font` vs `fontFamily`**: both select a family; both should seed the active
  family for weight resolution.
- **Nested families after `extends`**: `FontScale` is merged across systems —
  active-family lookup must see inherited families (it does today via the merged
  scale).
- **No family selected**: today's keyword behaviour must remain the default
  (don't break standalone `weight="bold"`).
- **Generic families** (`sans`/`serif`/`mono` when not registered by a project):
  their scale *is* the keyword table, so nothing changes.
- **Inherited family**: the resolver works per style object and can't see an
  ancestor's `font`. Decide and document: family-relative resolution applies only
  when the family is set on the same element (or exposed via a shared context).
- **Unknown name in a known family**: fall back to CSS keyword, then raw
  (or error — decide).
- **Back-compat**: `weight="sans.bold"` must keep working unchanged.

---

## 7. Tests to change / add

Rust (`packages/reference-rs/modules/atomic/src/resolve/font/tests.rs`,
`packages/reference-rs/modules/base-system/src/fonts.rs`):

- Update `test_bare_weight_uses_css_keywords`: bare `bold` should use the
  **active family** when one is provided, keyword when not.
- Add: `font="sans" + weight="thin" → 200`; `font="serif" + weight="normal" →
  373`; `font="mono" + weight="normal" → 393`.
- Add: no-family `weight="bold" → 700` (unchanged).
- Add: explicit `weight="sans.thin"` still wins / still resolves.
- Add: unknown name in active family → keyword fallback.

Docs (`packages/reference-docs`): the `WeightRamp` demo currently renders the
generic keyword ramp. Once the resolver is family-relative, the same
`weight="thin"` markup should render `200`; consider adding serif/mono rows to
exercise `373`/`393`.

Matrix / e2e: assert computed `font-weight` for `font="sans"` + `weight="thin"`
is `200` (guards the whole chain across bundlers/runtimes).

---

## 8. Open questions

1. Was family-relative `weight` ever implemented and later regressed, or was it
   only ever the `family.name` form? (Git archaeology in `atomic`.)
2. Should resolution be per-element only, or should a family set on a container
   influence descendants (requires inheritance the atomic pass doesn't model)?
3. Should the CSS keyword table remain for generic families, or move fully into
   each family's `weights`?
4. Do the per-family `weights` belong in the public type surface (autocomplete
   for `weight` values scoped to the chosen family)? Today `weight` is open.

---

## Appendix — key file map

| Path | Role |
| --- | --- |
| `packages/reference-lib/src/core/theme/fonts.ts` | family definitions + per-family weight scales |
| `packages/reference-rs/modules/base-system/src/fonts.rs` | `FontScale`, `FontDefinition`, `scoped_weight`, `generic()` |
| `packages/reference-rs/modules/atomic/src/resolve/font/family.rs` | `lower_font` — family + **family-aware default** weight |
| `packages/reference-rs/modules/atomic/src/resolve/font/weight.rs` | `lower_weight` — **family-agnostic** explicit weight |
| `packages/reference-rs/modules/atomic/src/resolve/font/mod.rs` | frames font+weight as one subsystem |
| `packages/reference-rs/modules/atomic/src/resolve/font/tests.rs` | codifies current keyword-fallback behaviour |
| `packages/reference-neo/src/collect/lib/evaluate.ts` | builds `fontWeights.<family>.<name>` tokens from `font()` |
| `packages/reference-docs/src/content/docs/components/typography-sections.tsx` | `WeightRamp` demo using bare names |

## Appendix — evidence commands

```bash
# per-family weight tokens are emitted (values 200 / 373 / 393 present)
rg -o "\-\-font-weights-[a-z-]+: [0-9]+" packages/reference-docs/.reference-ui/react/styles.css | sort -u

# but no utility exists for the family values
rg -o "font-weight_[0-9]+" packages/reference-docs/.reference-ui/react/styles.css | sort -u
# 100 300 400 500 550 600 700 900  ← no 200/373/393

# live: weight="thin" on font="sans" renders 100, not 200
#   /typography → Weight ramp → computed font-weight
```
