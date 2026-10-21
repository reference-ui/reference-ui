# ATM-SITE-46 — factory consts resolve

A `keyframes()` const resolves to its declared name at the consuming site.
Resolution holds through import aliases (including above a forward import —
imports hoist) and alias chains. Non-object and missing definitions,
foreign-package callees, and mutated factories refuse with a diagnostic.
A cleared factory clears its clones to a fixpoint, so no stale name
survives through a copy. A callee shadowed by a same-file pure arrow is not
a factory, but its call init folds through the pure-helper fence exactly
like the direct call spelling (`scope::call_init`), so the use paints with
no diagnostic.
