# COND — pseudo, nesting, and attribute conditions

Conditions are the `_`-prefixed keys (`_hover`, `_dark`), breakpoint keys
(`sm`), and raw selector keys (`'& > p'`) inside style objects. The engine
lowers them to `:is()` twin selectors, at-rules, and ancestor/descendant
wraps; Neo proves in a browser that the painted result matches the claim.
This group owns no host behaviour beyond `src/runtime/css/**` (shared,
captain-serialised); most rows expect no host change.

## Dialect

Authors write `_hover`, `_focus`, `_focusVisible`, `_active`, `_disabled`,
`_checked`, `_placeholder`, `_before`/`_after`, `_light`/`_dark`,
`_groupHover`/`_peerFocus`, `_motionReduce`/`_osDark`/`_print`,
`_expanded`/`_open`, breakpoint keys, and raw `&` selectors including comma
lists (`'&:focus, &:hover'`) and parent keys (`'input:hover &'`,
`':focus > &'`). Interaction pseudos always dual-bind native + data twin:
`:is(:hover, [data-hover])`. Colour mode is `[data-color-mode=…]` (D1).

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-COND-01..16,
ATM-ORDER-01..04, ATM-LEAF-10. Key leans: COND-02/10 (pseudo catalog),
COND-03/08 (colour mode, RS-7 retarget landed — goldens emit
`[data-color-mode=…]`), COND-09/14 (group/peer, `&`, comma lists),
COND-11 (media presets), COND-12 (unknown-condition warning), COND-13
(ranges, cited by RESP), ORDER-02/03 (bucket + pseudo order), LEAF-10
(quoted `!` is not importance). No row needs a new RS slice.

## Decisions

D1 (colour-mode attribute `data-color-mode`; RS-7 done, proven by
NEO-COND-04 alongside PRIM-07/TOKEN-05).

## Approved absences

- `[dir=rtl]` / `_ltr` / `_rtl`: zero lib-sheet hits; no author asks for
  bidi conditions. Revisit with a real author request.
- Panda multi-block condition objects (`@slot` cartesian product):
  engine-internal composition test, not Reference dialect.
- Config-defined custom conditions: Neo has no `conditions` table by
  design; authors write raw `&`/at-rule keys instead.
- W4 DELTA-1: `forced-colors`, `@supports` condition keys, `(hover: hover)`
  MQs. Zero-count in the lib sheet (F11); `_print`/`_motionReduce`/`_osDark`
  are covered, these three have no lib author. `@supports` keys additionally
  cite RS-15 (COND-15 blocked: the engine mis-lowers them to selector
  fragments). (w4-synthesis C-DELTA-1.)
- W4 DELTA-2: zero-count pseudos `:nth-child`, `:empty`, `:invalid`,
  `:visited`, `:indeterminate`. Zero-count in the lib sheet (F13); the COND
  catalog is positive-only. (w4-synthesis C-DELTA-2.)

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| `_rtl`/`_ltr` + `:where([dir=…], :dir(…))` wraps | No lib usage; absence above |
| `@slot` multi-block cartesian conditions | Engine test shape, not author API |
| Custom `conditions` table in config | No such table in Neo |
| Four-way dark selectors (`.dark`, `[data-theme]`, self-class) | D1: single `[data-color-mode=…]` ancestor wrap |
| `_themePrimary` / Panda `themes` JSON | Brand packs, not colour mode |
| `hideFrom` / `hideBelow` helpers | Panda helper utilities, not shipped |
