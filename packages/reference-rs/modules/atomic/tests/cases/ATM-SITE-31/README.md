# ATM-SITE-31 — fenced pure-helper call folding

Closed single-expression
helpers fold at call sites — nullary, args, defaults (including defaults
that reference earlier params), `function` declarations, both IIFE
spellings, index over param arrays, member reads over param objects,
folded-test ternaries in bodies, and multi-leaf captures that fan out
through passthrough. Object returns spread into `css()` and JSX beside
static siblings. The fence is v2's `pure_fn` descriptor adopted verbatim:
aliases, multi-statement bodies, `~`, and assignment in bodies refuse
with a diagnostic; a reassigned callee names its write; bare uncalled
function values never fold.

The impure-shape tripwires (`Math.random`, `.map`/`.reduce`, async, loops,
rest params, nested calls, spread args, `f?.()`) stay pinned at ATM-SITE-32,
kept green untouched.

Known seams: binary arguments fold through the shared binary node
(SITE-33: a non-finite binary arg refuses the whole call);
helper-returned computed keys compose with the folded-key slice (SITE-49).

Cross-file arms: imported arrow, function declaration,
and object-return calls fold through the walked origin's descriptor
(v2's `ExportEntry::PureFn`), including a capture baked from a third
file's export; an imported impure helper refuses with a diagnostic.
Binding-walk arms pin the five oracle divergences: same-named helpers in
two files resolve by binding with no cross (`clash-a`/`clash-b`), three-hop
and aliased barrel chains fold (`hop-*`), a bare call with no import
refuses with a located diagnostic (`xbare.ts`), aliased imports fold
(`xalias.ts`), and import-then-export plus aliased export-from chains fold
including a re-exported declaration (`rmid.ts`).

Body-eval failure propagates, verbatim v2's `?`: a missing
member left of `&&`, a division by zero left of `||`, and either as a
ternary test refuse the whole call with a diagnostic — never yield past
the failure into the surviving arm. A pure call in a const init
(`const x = getColor()`) folds through the post-attach init pass
 (`scope/call_init.rs`): v2 folds it via
`resolve_declarator`→`call_to_literal`, and the fence now folds inits
exactly like call sites, so the use paints with no diagnostic. The
sibling case ATM-SITE-80 pins scalar, object, and array call inits
plus the impure refusal.
