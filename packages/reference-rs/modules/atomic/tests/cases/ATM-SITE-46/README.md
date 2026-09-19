# ATM-SITE-46 — factory consts resolve

Overmatch Ph3 (SPEC-V2-62): `keyframes()` and `positionTry()` consts are
const-resolution language — the identifier resolves to the declared name at
the consuming site, through import aliases (including above a forward
import — imports hoist) and alias chains. `viewTransition()`
refuses as a value (v2 refuses too — with our diagnostic), as do non-object
and missing definitions, shadowed and foreign-package callees, and mutated
factories. A cleared factory clears its clones to a fixpoint, so no stale
name survives through a copy.

Panda: `cross_file.rs:1437` (keyframes), `:1460` (positionTry), `:1481`
(viewTransition refusal).
