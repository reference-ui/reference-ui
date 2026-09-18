# Mission: firstThatWorks()

Status: `idea` (HQ, 2026-09-18). Split out of the Panda v2 parity mission:
this is a feature, not core AST language.

## What it is

Ordered CSS value fallbacks — the progressive-enhancement pattern CSS
already has, made writable. Author lists values preferred-first; emission
reverses (CSS keeps the last declaration it understands):

```tsx
css({ width: firstThatWorks('min(60rem, 100%)', '75%') })
// → .x { width: 75%; width: min(60rem, 100%); }
```

Two forms (per v2's design note): the plain string
(`'firstThatWorks(a, b)'`, no import) and the imported call (folds to the
written form). V2 only folds its *own* import — a local same-named function
does not fold. That rule maps cleanly onto our import-bound sites.

## Adoption cost if HQ says in

Runtime export (canonicalizing tag: call → written-form string) + extractor
fold + emission expansion (one declaration per member, reversed) + class-name
encoding (escaped parens/commas) + conditions/recipes/minify interplay +
stations + refuse tests. A real vertical slice to the engine, though a
fairly straightforward one.

## Precondition (captain's note)

No browserslist or support baseline exists anywhere in the repo. This
primitive answers "how do we serve pre-X browsers" — that question is
unasked. Recommend: declare what we support first; firstThatWorks then
either sells itself (pre-oklch fallbacks for an oklch shop) or stays absent.
Do not adopt the primitive as a substitute for the policy.
