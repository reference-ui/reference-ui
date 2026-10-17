# ATM-SITE-46 — factory consts resolve

: `keyframes()` and `positionTry()` consts are
const-resolution language — the identifier resolves to the declared name at
the consuming site, through import aliases (including above a forward
import — imports hoist) and alias chains. `viewTransition()`
refuses as a value (v2 refuses too — with our diagnostic), as do non-object
and missing definitions, foreign-package callees, and mutated factories.
A cleared factory clears its clones to a fixpoint, so no stale name
survives through a copy. refines the shadowed arm: a callee
shadowed by a same-file pure arrow is not a factory, but its call init
folds through the pure-helper fence exactly like the direct call spelling
(`scope/call_init.rs`), so the use paints with no diagnostic.
