# ATM-SITE-39 — imported const objects spread at top level and under conditions

Overmatch station-only (SPEC-V2-51): pin the cross-file instance of
spread-of-const-object (SITE-11 unpack × SITE-16 merge). An imported
`hover` object spreads beside a static sibling and under `_hover`, with
one want and one runtime plan per leaf. Zero diagnostics.

Panda: `cross_file.rs:316` (`imported_object_spreads_under_condition`).
