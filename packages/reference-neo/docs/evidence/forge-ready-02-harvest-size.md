# Harvest on the lib Book is ~1.8k gross wants (low thousands): pool 518 × 10 kind-compatible sinks.

Pool: distinct alphabet-shaped string literals in `packages/reference-lib/src` (313 files, 5461 distinct literals scanned; corpus = compile inputs per `packages/reference-lib/ui.config.ts:12`). Sinks: `(prop, when, kind)` from a live lib neo sync reproducing the 213 census exactly (2026-09-19).

## Pool by ValueKind (Part I alphabet, strict)

| Kind | n | Example |
|---|---|---|
| named-color | 10 | `red` `packages/reference-lib/src/components/Overlay/fixtures/dialog-fixture.tsx:512`, `transparent` `packages/reference-lib/src/components/Calendar/Calendar.tsx:103`, `currentColor` `packages/reference-lib/src/components/Icon/Icon.book.tsx:599` |
| hex | 45 | `#1e3a5f` `packages/reference-lib/src/components/Overlay/Overlay.book.tsx:1441` |
| color-fn | 244 | `oklch(…)` ×216 in `packages/reference-lib/src/core/theme/colors.ts:5`, `rgba(0,0,0,0.5)` `packages/reference-lib/src/components/Overlay/Overlay.book.tsx:55`, `color-mix(…)` `packages/reference-lib/src/components/Tree/Tree.tsx:361` |
| length | 105 | `13px` `packages/reference-lib/src/components/Icon/Icon.book.tsx:860`, `0`, `100%` |
| math/transform | 48 | math 2 (`calc`, `packages/reference-lib/src/core/theme/primitives/document.ts:32`) + transform 26 (`translateX(1.25rem)` `packages/reference-lib/src/components/Switch/Switch.tsx:32`) + `var()` 20 |
| keyword | 4 | `auto` `packages/reference-lib/src/components/Button.book.tsx:60`, `none` `packages/reference-lib/src/components/Reference/components/shared/MonoText.tsx:14`, `inherit` `packages/reference-lib/src/components/Field/Field.story.tsx:29`, `None` FP `packages/reference-lib/src/components/Calendar/Calendar.book.tsx:18` |
| rhythm | 62 | `13r` `packages/reference-lib/src/components/Icon/Icon.book.tsx:408`, `1r 2r` `packages/reference-lib/src/components/Calendar/Calendar.tsx:105` (58 single + 4 lists) |
| **Total** | **518** | named set = `CSS_COLOR_KEYWORDS` `packages/reference-core/src/system/panda/config/extensions/color/utilities.ts:7`, minus CSS-wide; lengths per mission unit table; rhythm = `resolve_single_rhythm` grammar `packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs:43` |

Excluded (judgment calls, not in 518): 97 shorthand-multi (`1px solid`, `0 2px 8px rgba(…)` — no ValueKind), 6 `translateY` + 1 two-part transform (`packages/reference-lib/src/core/theme/primitives/forms/checkbox.ts:38`), 3 `url()+format()` font-srcs, 2 `brightness()`, 49 bare numbers (only `0` harvested), 59 token paths, 3 hex-odd (`#catalog` URL fragments). `book/` adds ≤40 more (2/1/0/13/2/2/20).

## Sinks by (prop, when, kind)

24 Dynamic\*-in-value-position diagnostics, every site inspected and all `when=[]`: `height`×6, `fontSize`×3, `px`×3, `colorMode`×3, `offset`×3, `width`/`gap`/`borderBottomWidth`/`color`/`minW`/`minH`×1. Messages name the prop (`packages/reference-rs/modules/atomic/src/extract/expressions/walk.rs:364,421,612`).

| Sink (prop, []) | kind | Sites |
|---|---|---|
| color | Color | `packages/reference-lib/src/components/Reference/components/shared/MonoText.tsx:19` |
| height, width, minW→minWidth, minH→minHeight, gap, fontSize, px→paddingInline, borderBottomWidth, offset | Length ×9 | `packages/reference-lib/src/components/Icon/Icon.book.tsx:463`, `packages/reference-lib/book/app/BookCanvas.tsx:185`, `packages/reference-lib/src/components/Overlay/Overlay.book.tsx:1432`, `packages/reference-lib/src/components/Collapsible/Collapsible.tsx:192`, `packages/reference-lib/src/components/Tooltip/Tooltip.tsx:414`, `packages/reference-lib/src/components/ReferenceLibrary/ReferenceLibrary.tsx:167` (aliases `packages/reference-rs/modules/canon/src/dialect.rs:338,339,350`; `offset` is a CSS prop `packages/reference-rs/modules/canon/src/css/properties.rs:2379`) |
| colorMode ×3 | — (excluded: runtime-owned, lowers to zero decls `packages/reference-rs/modules/atomic/src/resolve/mod.rs:84`) | `packages/reference-lib/book/decorator/BookDecorator.tsx:27`, `packages/reference-lib/src/components/Portal/Portal.story.tsx:205` |

Not sinks: 74 spreads (no prop), `css={css}`/`_focusVisible={focusRing}` (`NonObjectJsxStyle` `packages/reference-rs/modules/atomic/src/diagnostics/codes.rs:86`, block position). Census cross-check: 82 gaps + 74 + 31 + 15 + (7+2+1) + 1 = 213 exact.

## Product

Color 299×1 = 299; Length (105+62+2 math)×9 = 1521; transform/var ×0 compatible sinks = 0. **Base 1820 → thousands.** Variants stay thousands: +keywords-everywhere 40 → 1860; +var-onto-length 180 → ≤2040; naive 518×10 = 5180. Gross wants; `AtomSet` dedupes against already-minted site atoms so net new is smaller.

Slice-4 note: thousands is a sink-filter note (kind gate + §14 owned-props drop `gap`/`offset` on ToastHost/Overlay.Content), never a blocker.
