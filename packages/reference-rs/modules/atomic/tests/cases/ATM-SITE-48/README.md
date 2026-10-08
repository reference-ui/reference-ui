# ATM-SITE-48: Element Access over Const Tables (Fold Arm)

Probes SPEC-V2-63's fold: `obj[key]` and `arr[i]` resolve when
the base is a const object, a const array, or an inline literal and the
index folds to a string or number — literal, single- and multi-leaf const
identifier, one-hop member, nested element, `?.[`, concat, unary, and
interpolated-template indices. Every hit mints one want and shares one
plan per leaf; holes omit silently. Chains resolve inside out through
nested entries (entry 63); static member paths still ride SITE-29.

Refusals warn once with the failing side named and keep static siblings:
an unfoldable index (`colors[dk]`, `colors[pick()]`), an unfoldable base
(`maybe['red']`), a missing entry (`colors['typo']`, `sizes[9]`, the typo
leaf of a partial multi-leaf index), a scalar-chained read
(`colors['red']['length']`), and a reassigned table (names the write).
Chains over nested entries resolve inside out (`swatches['red']['500']`,
static bases, three-hop, arrays of objects); a nested miss warns the
outer key, a missing or multi-leaf intermediate refuses the outer base.
Concat and interpolated-template indices fold through the shared binary
and template nodes (entry 63); helper-call indices still refuse.
