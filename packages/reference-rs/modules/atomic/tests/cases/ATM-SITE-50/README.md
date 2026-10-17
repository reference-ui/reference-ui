# ATM-SITE-50 — whole-object and member args resolve; the rest diagnose

No silent drops, plus the resolve half.

An argument that folds to an object extracts exactly as if spread: bare
identifiers over local and imported const objects, single-hop members
over nested const objects, conditional arms in either position,
merge-list elements, and both operands of an arg-level `&&`/`||`/`??`.
JSX `css` and condition props lower the same shapes (condition props
under their `when`). Wrapped whole objects (`as const`) unwrap first;
a param shadowing the object name refuses.

Every other non-object arg diagnoses with its position and keeps
siblings: calls, scalars, missing names, deep members, dynamic logical
lefts, call-arg spreads, mutated bases (naming the write), and the live
`` css`…` `` tag.

The silence controls pin what stays quiet: `css()`, `css({})`,
`false`/`null`/`undefined` holes, literal filler args (`css('panda',
{...})`), null ternary arms, guard logical lefts, and
non-`css` tags.

Inputs: `args.ts` (whole-object, member, imported, wrapped, call,
scalar, missing, deep, logical, spread, mutated, string-head / hole /
empty controls, merge list, param shadow), `shared.ts` (the imported
const objects), `branches.ts` (identifier arms, member arms, logical
arms, silent null arm, call arm, nested arms), `tags.ts` (live tag
diagnoses, dead tag silent), `jsx.tsx` (identifier / member / logical /
call / wrapped / spread-list style props, condition-prop blocks),
`compose.ts` (alias-chain whole object, destructured-rest whole object).

Our positional diagnostic beats the silent slot.
Alias chains and destructured rest compose on
top via `compose.ts`; multi-hop members compose when that
slice lands.
