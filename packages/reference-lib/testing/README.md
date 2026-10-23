# Component cases

Each CT case is a folder named by its raw ID; unit declarations come from test files.
The catalog indexes executable unit and browser
declarations, not the component's design notes. `pnpm agentct check` validates the
entire catalog without starting a browser; a conforming index does not mean its
tests have passed.

```bash
pnpm agentct check
pnpm agentct list
pnpm --silent agentct list --json
pnpm agentct search "native form"
pnpm --silent agentct --search "native form" --json
pnpm --silent agentct Button --list --json
pnpm agentct run LIB-BUTTON-001
pnpm agentct Button
pnpm agentct Button --e2e --react all
```

A CT case follows the repository case convention (AGENTS.md section 7):

```
src/components/Button/__e2e__/LIB-BUTTON-001/
  case.json                 {"id": "LIB-BUTTON-001", "name": "<one-line claim>"}
  README.md                 first line: # LIB-BUTTON-001 — <one-line claim>
  Button.ct.spec.ts         exactly one declaration (one it.each counts as one)
  __snapshots__/            optional baselines for this case
```

Every folder directly under `<Component>/__e2e__/` is a case folder. Its name is
`LIB-<COMPONENT>-<nnn>`, with the component directory name uppercased. `case.json`
holds exactly `id` and `name`; `id` equals the folder name and `name` is a
non-empty claim. The README heading names the same ID, and its claim equals
`name`. The folder holds one `*.ct.spec.ts`, and that spec holds one declaration.
Files at the `__e2e__/` root itself, such as its README or a config, are not cases.
Keep an existing ID when its test changes; give new behavior a new ID without
renumbering.

Unit evidence needs no index. Every `*.test.ts(x)` outside `__e2e__/` is
discovered, and each declaration becomes a catalog entry labelled
`<Component>/<file>:<line>` and named by its full declaration title, with outer
and inner suite titles joined by one space. A component-root `case.json` is not
read.

Conformity collects every problem and fails once, one line per problem, as
`<Component>/__e2e__/<folder>: <problem>`. It fails on a broken case folder, a
`*.test.ts(x)` under `__e2e__/`, a `*.ct.spec.ts` outside `__e2e__/<ID>/`,
symlinked component folders or evidence, a duplicate ID, and an exported component
with no CT case or unit declaration. Unexported components with no evidence stay
in the catalog as empty entries, and running one fails explicitly.

`list`, `search`, and their `--search` alias report CT case IDs and unit labels. Add `--json` for one parseable JSON value on stdout with no human
trailer, invoked as `pnpm --silent agentct ... --json`: default `pnpm` prints
package-script banners on stdout, so the silent form is what keeps the value
machine-readable. A search with no matches returns an empty list and a nonzero
exit. Listing and searching are catalog-only: they never start the daemon or a
browser.

Disabled tests and focused suites fail conformity. Tests use static titles and callbacks;
dynamic test-generation loops require rewriting as explicit cases or supported
`it.each` declarations.

For `it.each`, the catalog keeps the declaration's unexpanded title (`%s` or
`$name` stays in the title) as one entry. The table must be a nonempty static array, inline or
in a local variable. Selecting that case runs every row, and execution proof
requires the complete expected count to pass. Parameterized suites and
spread/dynamic tables fail rather than silently dropping evidence. A named table
resolves at its declaration's lexical scope, so sibling or nested tables cannot
leak into an outer declaration; empty `%s`/`$name` expansions still match their
runtime row. A table is trusted only while it stays provably immutable: a write,
an element assignment or update, any method called on the named table, a foreign
`.each(...)` that is not the framework's own, or a reference handed to another
function or object — including through a shorthand, keyed, nested, spread, or
aliased aggregate — is rejected instead of being evaluated, because such a use
can register rows the static table never declared. A table used directly as
`each`'s argument, an immutable `const` alias, and the framework `it`/`test`
`.each` modifier stay permitted.

Vitest test bindings may be renamed (`import { it as spec } from 'vitest'`), and
an aliased runnable declaration or suite keeps its full title. A renamed
`skip`/`only`/`todo`, a computed modifier such as `it['skip']`, an unknown
computed modifier, and any unsupported tagged `each` form fail conformity rather
than vanish beside a recognized declaration, as does a framework test function
routed through an unsupported alias shape (inline destructured object/array,
conditional, sequence, logical expression, or factory call). Unrelated objects,
destructuring, conditionals, and locally shadowed names stay harmless. A runtime
`test.skip(...)` inside a callback stays execution evidence, not a declaration.

A name filter (`-g`) selects every declaration whose title or expanded row title
matches and runs all rows of each selected declaration. Unit selections hand
Vitest the exact union of the declaration's known expanded row titles. Browser
(`ct`) selections are never handed that title pattern: Playwright prefixes the
project and file onto each test title, so CT is selected by its exact file and
declaration line instead. A filter that matches nothing, or an invalid pattern,
fails before execution. Unfiltered component and all runs omit the unit title
filter and collapse CT targets to whole files only when every declaration in
that file is selected; the same expected evidence is still required. Grep cannot
enumerate the rows of a parameterized declaration whose row titles are not
statically known, so any such candidate in the requested layer (`--unit`
narrows the universe to unit evidence, and likewise `--e2e`) rejects grep before
execution and points at the catalog case ID. Legacy `--id` and `--line` targets
map back to exactly one catalog declaration by contained file, declaration line,
or title (including an expanded `each` row); no match, an ambiguous match, or an
unresolvable opaque row identity fails and points at the catalog case ID.
Selecting a catalog ID always runs all rows of its declaration.

Verification runs conformity first, then the requested evidence. A zero exit
code without a readable execution report, zero passing tests, a skipped selected
case, or incomplete parameterized rows fails. When a declaration's row titles are
statically known they are matched literally, and their exact multiset must pass
per file and runtime: a duplicate, unknown, or wrong-runtime row cannot stand in
for a missing expected row. A component with only one evidence layer reports the
absent layer explicitly; requesting that absent layer with `--unit` or `--e2e`
fails. Component names target their exact directory, so `Field` does not run
`DateField` or `NumberField`.

Each verification job stores its reports, videos, screenshots, and diffs under
`playwright/test-results/agentct-<pid>/`, with separate React-major directories.
Parallel jobs cannot erase one another's artifacts. Ordinary browser runs pass
`--update-snapshots=none`: missing baselines and visual differences fail, and
verification does not create or change PNG baselines. Baseline changes still
require the explicit human-verification workflow in the `test-component` skill.

Verification permits one active local job, covering units and every requested
React browser run. Queued invocations share a warm Vite gallery; unit-only
selections do not start that gallery. Vitest and Playwright each have a maximum
of two workers, including the direct fallback. Set `CT_WORKERS=1` for a smaller
job; larger overrides cannot expand the budget. Cancellation retains the slot
until the child stops and escalates the job's owned process groups, so detached
Playwright server/browser leaders cannot outlive their slot. The direct fallback
never takes over an existing listener on the CT port; `pnpm agentct stop`
terminates active jobs and the daemon's owned groups without touching unrelated
listeners.

The gate's own regression tests run with:

```bash
node --test --test-concurrency=1 .agents/skills/test-component/scripts/cases/catalog.test.mjs .agents/skills/test-component/scripts/cases/resources.test.mjs
```

These exercise malformed and incomplete catalogs, source discovery, execution
report completeness, exact component targeting, and artifact isolation. Component
verification continues to use `pnpm agentct`; core or matrix changes continue to
use `pnpm agent`.

Part of Reference UI, via the lib package.
