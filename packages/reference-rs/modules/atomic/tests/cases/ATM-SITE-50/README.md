# ATM-SITE-50 — whole-object and member args resolve; the rest diagnose

Overmatch Ph1 no-silence sweep plus the Ph3 resolve half (SPEC-V2-65,
SPEC-V2-38 tagged).

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
{...})`, SPEC-V2-36), null ternary arms, guard logical lefts, and
non-`css` tags.

Inputs: `args.ts` (whole-object, member, imported, wrapped, call,
scalar, missing, deep, logical, spread, mutated, string-head / hole /
empty controls, merge list, param shadow), `shared.ts` (the imported
const objects), `branches.ts` (identifier arms, member arms, logical
arms, silent null arm, call arm, nested arms), `tags.ts` (live tag
diagnoses, dead tag silent), `jsx.tsx` (identifier / member / logical /
call / wrapped / spread-list style props, condition-prop blocks).

Panda: `scope.rs:43` (const object identifier), chain `:63`/`:671`,
rest `:587`, staged `calls.rs:548`, positional `None` `:1719`, arg-`&&`
`atomic.rs:1626` — our positional diagnostic beats the silent slot (S7).
Alias chains (SPEC-V2-34), destructured rest (SPEC-V2-32), and multi-hop
members (SPEC-V2-31) compose on top when those slices land.
