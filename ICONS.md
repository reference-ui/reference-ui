# Icons: simpler components after the last milestone

This note is **narrow**: how **`@reference-ui/icons`** (and any icon-like `StyleProps` surface) becomes **simpler and first-class** once **dynamic allocation of Panda `jsx` scan targets** lands (see `LAST_MILESTONE.md`).

---

## Today (short)

- **Runtime:** Icons use `splitPrimitiveStyleProps` → `splitCssProps` + `box()` + optional `css()`—aligned with primitives (`packages/reference-icons/src/styleProps.ts`, `createIcon.tsx`).
- **Types:** `MaterialSymbolIconProps` extends `StyleProps` plus SVG concerns (`packages/reference-icons/src/types.ts`).
- **Panda:** The box pattern’s `jsx` list is **only** `PRIMITIVE_JSX_NAMES` from `reference-core`, so **generated icon component names are not** on Panda’s “extract style props from this JSX tag” list unless we add them elsewhere.

So icons already **feel** like the design system at runtime; the **gap** is extraction and any **duplication** of logic or documentation that exists only to paper over that gap.

---

## After the last milestone

**Discovery** (Atlas + Tasty, as in `LAST_MILESTONE.md`) produces the set of JSX tags Panda should treat as style-bearing. That set **includes** any exported icon whose props **extend** `StyleProps` **and** which appear in user (or library) JSX with style keys—**without** hand-maintaining thousands of names in `extendPatterns.ts`.

### What gets simpler

1. **No parallel “icon registry” for Panda** — The same pipeline that picks up `MyCard` or `AppButton` picks up `HomeIcon`, `SettingsIcon`, etc., when they match the type + usage rules.
2. **Docs and mental model** — `reference-docs` (and any `ICONS.md` in packages) can describe **one** rule: “Icons are `StyleProps` components; they follow the same extraction story as everything else.” Optional: document icon-specific props (`variant`, `size`, …) separately without conflating them with Panda’s scan list.
3. **`createIcon` implementation** — Stays focused on SVG wiring (`variant`, `size` → width/height, `ref-svg`, theme boundary). Less pressure to add **workarounds** (e.g. “always wrap in `<Svg>` for extraction”) when Panda already knows the icon tag.

### Icon-specific props vs style props

Some props are **not** Panda utilities but still belong on the component (`variant`, `size` as forwarded to `<svg>`, etc.). The milestone work **does not** conflate them:

- **Panda / style namespace** — keys handled by `splitCssProps` / `box`.
- **DOM / SVG namespace** — passthrough after split.

Documentation for icons should keep that distinction clear so authors know which props participate in **token CSS** vs **raw SVG attributes** (see `createIcon` destructuring order in `packages/reference-icons/src/createIcon.tsx`).

---

## Unblocked work (checklist)

- [ ] Land **computed `jsx` list** from Tasty + Atlas (`LAST_MILESTONE.md`).
- [ ] Add **Atlas/Tasty cases** that reference **generated** icon-like components (or stubs with the same props shape) and assert names appear in the merged scan set.
- [ ] **Panda smoke:** app uses only `<SomeIcon color="…" />` with no primitive wrapper; CSS/token output is present.
- [ ] Refresh **package docs** (`packages/reference-docs/src/docs/components/icons.mdx` and friends) to remove extraction caveats once the pipeline is live.

---

## Related source (pointers)

- Icon factory: `packages/reference-icons/src/createIcon.tsx`
- Style split: `packages/reference-icons/src/styleProps.ts`
- Panda box `jsx` baseline: `packages/reference-core/src/system/panda/config/extensions/api/extendPatterns.ts`
- Milestone design: `LAST_MILESTONE.md`

---

## Summary

**Good? Cool.** Icons become a **straightforward** consumer of the unified “style props surface + discovery” story: same types, same runtime split, same **derived** Panda scan set—no special-case symphony of hand-maintained JSX name lists for every glyph export.
