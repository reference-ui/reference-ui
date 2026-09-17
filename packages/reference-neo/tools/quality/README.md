# Neo quality gate

This gate keeps Neo's TypeScript small enough to analyze, honest about failure,
and free of silenced diagnostics. It mirrors the agent-rs stance for Rust, adapted
to a runtime where the compiler, the linter, and the build scripts all speak
JavaScript. Structural quality only: the gate never formats, prettifies, or
reorders code. Formatting is a later commit-hook decision, not a correctness bar.

## Each tool for what it is good at

Three layers share the work, and none reimplements another. Biome owns lint rules:
the recommended correctness and suspicious sets, the `any` ban, cognitive
complexity, and the import boundary against core and lib paths. The strict
`tsc` pass owns type errors the linter cannot see. The
metrics counter owns the numeric thresholds Biome lacks: McCabe branches,
parameter counts, control depth, and line counts. A small prose check rides along
for the two things no linter will ever judge, file headers and README shape.
The runner itself is plumbing: it shells out, maps severities, prints one fix tip
per violation, and exits 0 clean, 1 on violations, or 2 when tooling is missing.

One override lives in `biome.json`: `noShadowRestrictedNames` is off for
`react-surface.d.ts`, whose tag lines mirror generator emit — the `<map>`
tag's component is honestly named `Map`, so the shadowing is the contract.
The biome config is strict JSON (no comments), which is why this note lives
here instead of beside the override.

Two facts about the toolchain shaped this split. First, Biome 2.x has no
`--diagnostic-format` flag; the runner asks for `--reporter=json` and only falls
back to scraping rule hits from human-readable text if JSON stops parsing. Run
`biome lint` only, never `biome check`, so the disabled formatter stays out of
the picture. Because Biome 2 rejects a nested config when the invocation
directory is the project root, and this gate owns no directory above its own,
the runner launches Biome from neutral ground with absolute paths everywhere. Second, the workspace ships TypeScript 7, whose classic compiler
API is gone: the bare `typescript` import is a version stub, and parsing lives
behind the `typescript/unstable/sync` project API with AST kinds and traversal
from `typescript/unstable/ast`. The counter opens one inferred-project snapshot
per run, walks each file once, and closes it. Matching is kind-based, so a `?`
in a type position is a different node kind than a value-level branch and can
never inflate McCabe. No homemade linter lives here: targeted counting plus
shell-out plumbing, nothing more.

The type pass shells `tsc --noEmit -p` against the package tsconfig and keeps
only diagnostics inside the collected targets, instead of passing explicit
flags plus file lists. One config stays the source of truth for the strictness
the whole package is held to — editors and bare `tsc --noEmit` runs see exactly
what the gate sees — while `q [paths]` still reports just the files it was
asked about. The trade is that a `q` path outside the project include gets
lint, metrics, and prose but no type coverage, since the project pass cannot
see it; that never happens in normal use, where every target lives under
the package.

## Thresholds and severities

Fail lines are errors: cyclomatic above 12, cognitive above 20, parameters above
5, function length above 120, file length above 500, control depth above 4. Warn
lines are loud but non-failing: cyclomatic above 8, cognitive above 12, params
above 4, function above 80, file above 365. Depth has no warn line; four deep is
already a design smell, and a fifth level fails outright. Generated files, marked
by an `@generated` header or a `.gen.` filename infix, skip the two length rules
and nothing else: generated complexity is still complexity. Type safety is
non-negotiable, so the `any` ban and the strict type pass are errors, and every
enforced rule maps to a one-paragraph agent-facing tip printed under the fault.
`q --report` prints the complexity distribution, percentiles plus top offenders
per metric, and exits 0, so threshold tuning stays measured instead of vibes.

## Suppressions are their own failure

The gate runs the linter first, then reports suppressions as a separate category
with its own message: dodging the contract is not a lint warning. Any
`biome-ignore` in any form fails, `@ts-ignore` fails, and `@ts-expect-error`
passes only with a same-line justification of at least ten characters; bare ones
fail. The scanner reads raw lines, so it also catches pragmas hiding in comments
about pragmas: gate sources split every needle they scan for. A dump cannot land
by switching the gate off.

## The boundary: Neo never imports core or lib

One Biome rule outside the recommended sets is enabled as an error:
`noRestrictedImports` rejects every specifier that reaches the core or lib
paths, whether scoped package imports, bare names, or relative paths that walk
across. Neo copies solved code into Neo-owned modules; it never imports across
the boundary. The rule covers static imports, re-exports, and dynamic imports
alike, with a fix tip pointing at the copy-instead policy.

## Tuning policy

Recommended rules are a starting point, not dogma. When a recommended Biome rule
fires on honest gate or CLI code, the fix is to turn that rule off in the errors
config and record why in the log below, never to suppress it at the site. Style,
accessibility, performance, security, and nursery groups stay off except the
single `noRestrictedImports` boundary rule in style: this gate judges structure,
not taste. Every tuning entry names the rule, the honest code it misjudged, and
the date, so a future reader can tell policy from drift.

## Tuning log

No recommended rule has needed tuning yet: the one Biome error the self-run
surfaced, a `valueOf` parameter shadowing a restricted name, was a legitimate
catch and got renamed, not silenced. The self-run keeps two non-failing
warn-tier hits on the prose checker, whose prior-run source is carried
byte-identical by contract; they stay loud until that file is revisited. One
precision note: the warn pass also emits Biome's own `suppressions/unused`
engine note on files that carry suppression comments, since every rule is off
there. That is bookkeeping, not an enabled rule, and those files already fail
the suppression tier, so the pass still contains only cognitive warnings.
