# ATM-SITE-31 — fenced pure-helper call folding

Overmatch build station (SPEC-V2-39, Ph3 row 6): closed single-expression
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
rest params, nested calls, spread args, `f?.()`) stay pinned at ATM-SITE-32
(SPEC-V2-42), which this slice must keep green untouched.

Known seams, filed not silent: binary arguments fold through the
shared binary node (SITE-33 seam, closed by the tail crew — a non-finite
binary arg refuses the whole call); helper-returned computed keys compose
with the folded-key slice (SPEC-V2-40, SITE-49).

Cross-file arms (SPEC-V2-57, Ph4): imported arrow, function declaration,
and object-return calls fold through the walked origin's descriptor
(v2's `ExportEntry::PureFn`), including a capture baked from a third
file's export; an imported impure helper refuses with a diagnostic.
Binding-walk arms pin the five oracle divergences: same-named helpers in
two files resolve by binding with no cross (`clash-a`/`clash-b`), three-hop
and aliased barrel chains fold (`hop-*`), a bare call with no import
refuses with a located diagnostic (`xbare.ts`), aliased imports fold
(`xalias.ts`), and import-then-export plus aliased export-from chains fold
including a re-exported declaration (`rmid.ts`).

Body-eval failure propagates, verbatim v2's `?` (39-F2): a missing
member left of `&&`, a division by zero left of `||`, and either as a
ternary test refuse the whole call with a diagnostic — never yield past
the failure into the surviving arm. A pure call in a const init
(`const x = getColor()`) is the filed follow-up (39-F3): v2 folds it
via `resolve_declarator`→`call_to_literal`, the fence folds at call
sites only, so the use warns `DynamicIdentifier` until a post-attach
init pass lands.

Panda: `scope.rs:908` (nullary), `:927`/`:1208` (IIFEs), `:945` (decl),
`:1073` (defaults), `:1030` (object-return spread), `:986` (array index),
`:1085` (alias refuse), `:1184` (multi-statement refuse);
`cross_file.rs:1220` (imported arrow), `:1262` (imported decl),
`:1344` (imported object-return).
