# ATM-SITE-48: Element Access over Const Tables (Fold Arm)

Probes SPEC-V2-63's single-hop fold: `obj[key]` and `arr[i]` resolve when
the base is a const object, a const array, or an inline literal and the
index folds to a string or number — literal, single- and multi-leaf const
identifier, one-hop member, nested element, and `?.[` indices. Every hit
mints one want and shares one plan per leaf; holes omit silently.

Refusals warn once with the failing side named and keep static siblings:
an unfoldable index (`colors[dk]`, `colors[pick()]`), an unfoldable base
(`maybe['red']`), a missing entry (`colors['typo']`, `sizes[9]`, the typo
leaf of a partial multi-leaf index), a chained read (`colors['red'][...]`,
single-hop by design — nested tables ride SITE-29), and a reassigned
table (names the write). Concat and interpolated-template indices refuse
until SITE-33/51 extend the index fold; helper-call indices refuse until
SITE-31 lands the helper fence.
