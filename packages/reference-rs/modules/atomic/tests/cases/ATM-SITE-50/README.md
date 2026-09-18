# ATM-SITE-50 — no-silence sweep: every site-path refusal diagnoses

Overmatch Ph1 no-silence sweep (SPEC-V2-65 Ph1 half, SPEC-V2-38 tagged).

Every `_ => {}` on a site path is now a located diagnostic: a `css()`
argument that is not a static style object (identifier, member, call,
arg-level logical, call-arg spread, non-object conditional arm)
diagnoses with its argument position while sibling args still extract;
JSX `css` / `r` / condition props diagnose non-object values the same
way; a tagged template on a live `css` binding diagnoses while any
other tag stays silent. Whole-object, member, and logical-arg *resolve*
ride Ph3 — Ph1 ends the silence, nothing more.

The silence controls pin what stays quiet: `css()`, `css({})`,
`false`/`null`/`undefined` holes, literal filler args (`css('panda',
{...})`, SPEC-V2-36), null ternary arms, and non-`css` tags.

Inputs: `args.ts` (whole-object, member, call, arg-level logical with a
kept sibling, call-arg spread, string-head / hole / empty controls),
`branches.ts` (identifier arms, silent null arm, call arm, nested
conditional arms), `tags.ts` (live tag diagnoses, dead tag silent),
`jsx.tsx` (identifier / logical / call / wrapped / spread-list style
props).

Panda: staged `calls.rs:548`, positional `None` `:1719`, arg-`&&`
`atomic.rs:1626` — our positional diagnostic beats the silent slot (S7).
