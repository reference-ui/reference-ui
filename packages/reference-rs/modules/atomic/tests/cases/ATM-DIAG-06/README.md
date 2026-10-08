# ATM-DIAG-06

Unicode diagnostic positions: non-ASCII source and selectors compile
without panic, and columns count UTF-16 code units so reported
positions match what an editor shows past the first multibyte
character.

`input/src/emoji.ts` puts a dynamic identifier past an emoji on line
3 (`content: '😀'` before `color: depth`); the emoji counts two
UTF-16 units, so the refusal column pins the unit (UTF-16 61,
scalar 60, bytes 63). `input/baseSystem.json` adds a global rule
under the CJK/accented selector `.日本語-café` with an unknown
`_bogus` condition. The spec asserts no panic, correct extraction
(`mt: '2r'` want, CJK selector in the sheet), the extract refusal at
3:61, and a located `ATM-W-UNKNOWN-CONDITION` for `_bogus`.

Mechanism: `line_col` (`diagnostics/mod.rs:62`) already renders
UTF-16 with a unit test; the global walker
(`stylesheet/global/walker.rs`) pushes file-less warnings from the
system surface. Related: `ATM-DIAG-04` (positions beyond extract),
`ATM-DIAG-05` (extract precision), `ATM-DIAG-14` (source modes).
Contract: [SPEC.md](../../../SPEC.md) (`ATM-DIAG-06`, open).
Operation Error Correct Slice 0; observed red hinge: the global
half only — the extract refusal already lands at 3:61 in UTF-16
units (green, as the map predicted), while the `_bogus` global
warning carries no file/line/column.
Search: diagnostics unicode UTF-16 columns emoji CJK global selector.
