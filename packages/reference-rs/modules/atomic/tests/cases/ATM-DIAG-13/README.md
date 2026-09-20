# ATM-DIAG-13

Producer seam: extract, harvest, resolve, and host facts retain one
site identity, deterministic ordering, stable codes, and no duplicate
final line — one authored site warns once, identifiably.

`input/src/hover.ts` carries the same dangling token path under two
condition blocks (`_hover` and `_focus`, `bg: 'ui.missing.path'`)
beside a static `mt: '2r'`. Both wants warn the same message, and
because resolve warnings carry no site identity the two final lines
are byte-identical — failing the no-duplicate-lines assertion. The
spec then asserts one site identity per line (located), stable
`ATM-*` codes, and byte-identical diagnostics across a second
compile (deterministic order).

Repro honesty note: a single hover + unknown-token site warns exactly
once in a single atomic compile (verified across three shapes:
`css()` with `caretColor`, `css()` with the Obj-1 `bg` alias, and a
const-object spread). The Objective-1 carry-forward's one-site ×2
(`VOYAGE-LOG-1.md`: hover usages emit exactly 2 file-less warnings
each) does not reproduce from one site at atomic level — the lib
doubling needs multi-file/use-site context above this station. What
reproduces here is the atomic-level defect the carry-forward
bundles: same-message wants collapse into indistinguishable
file-less lines (the committed `ATM-SITE-43` golden shows the same
shape: two identical `ATM-W-INVALID-CSS-VALUE` lines). Slice 3 must
give each line its site so same-message lines from distinct sites
stay distinct — and never collapse them by message the way
`runtime/builder.rs::is_duplicate` does today.

Mechanism: `resolve/tokens` warns per want with no location, so the
message alone keys the final line. Related: `ATM-DIAG-04`
(positions), `ATM-DIAG-05` (codes), `ATM-DIAG-07` (channel
isolation), `ATM-SITE-43` (observed ×2 golden), `ATM-TOKEN-14`
(passthrough trigger). Contract:
`docs/missions/operation-error-correct.md` stations + [atomic
SPEC.md](../../../SPEC.md) (row pending sibling crew). Operation
Error Correct Slice 0; observed red hinge: two byte-identical
`ATM-W-UNKNOWN-TOKEN-PATH` lines fail no-dupes; the site-identity
loop is the second hinge.
Search: diagnostics dedup duplicate producer seam ordering stable codes hover.
