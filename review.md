# Review — working tree (`reference-system`, 23 ahead of origin)

Scope: 32 modified + 6 untracked paths (incl. one deleted investigation doc,
new fixture, new matrix tier T16, new Rust alias tests). Net **+581 / −4726**
with the bulk of the deletions being `reference-icons/src/jsx-names.ts` (3865)
and `CSS_COMPOSITION_INVESTIGATION.md` (520).

The diff is one coherent story: **alias-host composition**. The compiler
now recognizes same-file `const X = Y` host aliases (atomic extract + styletrace),
`@reference-ui/icons` ships its CSS without a `jsxElements` crutch, `@reference-ui/lib`
layers the icons baseSystem, and matrix chain T16 proves the transitive path.
That story is sound and the tests are the right shape. Below is what sticks out.

---

## Blocking / should fix before commit

### 1. Dangling import to the deleted `src/jsx-names.ts`
`packages/reference-mcp/scripts/generate-icons-metadata.mjs:7` still resolves
and dynamically imports `../../reference-icons/src/jsx-names.ts`:

```js
const jsxNamesPath = join(here, '../../reference-icons/src/jsx-names.ts')
...
const { ICON_JSX_NAMES } = await import(jsxNamesPath)   // line 1805
for (const jsxName of ICON_JSX_NAMES) { ... }            // line 1826
```

That file was deleted here and the generator that emitted it was gutted. The
MCP icon-metadata script is now broken at runtime. Nothing in the diff replaces
the icon-name source (the obvious fix is to import the generated `src/generated/index.ts`
barrel instead). Worth fixing in this same change or explicitly parking it.

### 2. Three alias implementations that no longer agree
The alias feature was implemented separately in three places, with **different
scope semantics**:

| Location | Model |
| --- | --- |
| `atomic/extract/scope/table.rs` | scoped `(ScopeId, name)` edges, `Const`-gated at read, lexical hops |
| `atomic/diagnostics/analysis/jsx.rs` | flat `FxHashMap`, `Const/Using` only, last-wins across **all** scopes |
| `styletrace/analysis/…/identifier_aliases` | per-module map, walked with cycle guard |

The extract path is the strict one and is well tested (`alias_hosts.rs` pins
params/`let`/rebind staying silent). The diagnostics mirror is documented as
"scope-flattened like every mirror read (F-G1b)" — but flatness breaks in a way
that isn't just an approximation:

```ts
import { Div } from '@reference-ui/react'
const IconShell = Div
function f(IconShell) { return <IconShell mt="2r" /> }   // param shadows
```

- **Extract**: `alias_edge` resolves the param (`BindingKind::Param` ≠ `Const`) → silent. ✅
- **Mirror**: flat aliases still hold `IconShell → Div`, so `shadowed_plain_admitted`
  follows it to `Div` and **predicts a want**. ❌

There is a mirror test for `function f(Div)` (no alias) but **not** for a param
shadowing an alias, so this divergence is unpinned. If the diagnostic gate
compares mirror-predictions to extract output, this can produce a phantom
mismatch. At minimum add the mirrored test; ideally have the mirror reuse the
extract's gate or fail closed on shadowed alias names.

Also a minor peel divergence: extract uses `value::peel` (parens/`as`/`satisfies`/`!`)
while the mirror uses `values::unwrap_value` (adds `TSTypeAssertion`,
`TSInstantiationExpression`). Moot in `.tsx` mostly, but it means the two paths
can classify `const X = Y!`/`Y<T>` differently.

---

## Spiky / worth a decision

### 3. Unrelated lockfile churn
`pnpm-lock.yaml` (−282/+92) is not just two new workspace importers. It also
**bumps esbuild `0.27.3 → 0.28.2`** (in the `reference-neo` importer) and **drops
`@rollup/rollup-*@4.57.1`** in favour of `4.62.5` (plus `acorn`, `tinyglobby`
dedup). None of that is mentioned in the change description and none of it is
needed by the alias work. Either split it out or call it out explicitly — silent
dependency drift in a review is the classic thing that bites a release.

### 4. `layers: [iconsBaseSystem]` couples lib's dist to icons' compiler output
`packages/reference-lib/ui.config.ts` now imports and layers the icons
baseSystem. The comment is honest ("compiled CSS only — tokens and the JSX
roster stay icons-local"), but it means:
- lib's stylesheet now silently changes whenever icons' atomic output changes,
  so **lib must be rebuilt whenever icons is** (build-order coupling);
- the same utility CSS can be shipped twice if a consumer also layers/imports
  icons (dedupe is the compiler's job, but worth a T16 assertion on rule count).
This is the pragmatic A+C decision from the report; flagging it so the coupling
is deliberate, not accidental.

### 5. Stripping style props off icon call-sites is a real DX sharp edge
The lib edits (`Collapsible`, `Listbox`, `Icon.book`, `Showcase.book`) remove
`color`/`width`/`height` from icons and wrap one in a `Span ml="3r"`. This is
forced by the layering model — the config comment says it outright: *"Style props
must never cross into icons at a call-site: the icons runtime mints
`reference-icons__*` classes that only the icons compile can back."* That's a
surprising constraint for component authors (you cannot restyle an icon with a
style prop from a consuming library) and the workaround is to delete the styling.
- The visual result changed (icon colors and sizes in Book/Listbox/Collapsible).
  **This needs a `view-story` pass** before landing — `CheckIcon width="4r"` →
  default `md` size is a visible difference, not a no-op.
- Consider whether the public contract should be documented in the icons README
  ("wrap, don't prop") rather than only in a lib config comment.

### 6. Fixture build bootstraps by symlinking another package's `.reference-ui`
`matrix/fixtures/aliased-host-library/scripts/bootstrap-runtime.mjs` reaches
across into `packages/reference-lib/.reference-ui` and symlinks
`react/styled/system/types` into the fixture's `node_modules`. It also hard-fails
with a clear message if lib hasn't synced. Fine for a private matrix fixture, but
it's a hidden cross-package build dependency; the fixture `build` script encodes
the order (`pnpm --filter @reference-ui/lib run sync && …`). Just don't let this
pattern migrate into a real package.

---

## Smaller notes

- **T16 unit tests are near-vacuous** (`tests/unit/runtime.test.ts`): `Index()` is
  called as a function and only `.props['data-testid']` is inspected — it never
  React-renders. That's the generated matrix-template shape, so maybe acceptable,
  but it proves nothing about the composition; the 5 e2e assertions carry it.
- **T16 "every emitted class has a backing rule"** (`T16-contract.spec.ts:61`)
  hand-rolls a prefix allow-list `^(reference-|ref-|aliased-host-library__|chain-t16__)`.
  It's coupled to naming and will silently under-report if a new system prefix
  appears (false green) or over-report if an external lib shares a prefix. A
  comment-plus-regex contract is fine, but be aware it's not exhaustive.
- **`repoSourceExcludes` regression test** (`pipeline/src/build/rust/targets.test.ts`)
  is a good catch for the ENOSPC failure and correctly checks `**/dist`, `**/target`,
  scratch dirs. Note the new broad `**/dist`/`**/target` excludes are only safe
  because nothing generated is checked in — the comment says so; keep it true.
- **`AliasCollector` in diagnostics duplicates kind-tracking** already present in
  `atomic/extract/constants/collect.rs`; not wrong, just a second copy of the
  `visit_variable_declaration`/`kind` pattern.
- **`mutation of `matri/CHAIN.md` / `TEST_COVERAGE.md` counts** (11→12 tiers, T16
  row, `5/5` e2e) are internally consistent with the spec (5 tests). Good.
- **`FONT_WEIGHT_RESOLUTION.md`** is a new root-level design-divergence brief
  (per-family weight scales not consulted by explicit `weight=`). It's unrelated
  to this diff; it rides along as docs. Fine, but root-level `*.md` briefs
  are accumulating (`CSS_COMPOSITION_INVESTIGATION.md` deleted here). Consider a
  `docs/` home so the repo root doesn't keep collecting them.

---

## Verification status

I did not run the Rust suites, matrix, or the component flow for this review —
so the alias-host behavior and the lib visual changes are **unverified by me**.
Before landing, the intended proof paths are:

- `pnpm agentrs v atomic` / `pnpm agentrs v styletrace` (new alias unit tests)
- `pnpm agent test --packages=@matrix/chain-t16` (the e2e contract)
- `view-story` on Icon/Listbox/Collapsible for the stripped style props (#5)

---

## Addendum — harvest over-mint & container-root warning (2026-10-07)

### A. Harvest over-mint (dynamic `color={color}` → junk `c_*` rules)
When the compiler sees a dynamic prop it cannot resolve statically
(`color={color}` in `createIcon`), it pre-compiles ("harvests") color
utilities for every value the binding might take. Most guesses are
wrong. Live examples in the shipped icons CSS:

```css
.reference-icons__c_var\(--spacing-4r\,_16px\) { color: var(--spacing-4r, 16px); }
.reference-icons__c_oklch\(98\.7\%_0\.026_102\.212\) { color: oklch(98.7% 0.026 102.212); }
```

Spacing tokens harvested *as colors* (`color: var(--spacing-4r, 16px)` is
nonsense) plus `c_var` / `c_oklch` minted from `var(...)`/`oklch(...)`
expression text. (Correction: an early census reported "5 junk rules"
because escaped selectors — `c_oklch\(…` — collapsed under the grep;
the true count was 213 junk rules: 209 `c_oklch` + 3 `c_var` +
`c_white` — icons CSS was 220 rules / 31.3 KB, ~96% junk.)

**RESOLVED (merge):** color-harvest allowlist implemented in
`atomic/src/extract/harvest/mint/` (`harvest_accepts` gate only):
color-kind values mint iff `currentColor`/`transparent` or a real
`colors` token in the compiling system; CSS-wide keywords keep prior
oracle behavior; `var()`/unlicensed values never mint. Icons CSS is
now 7 rules / 12.1 KB, docs 343.6 → 299.1 KB, junk 0 everywhere,
legit `c_inherit`/`c_currentColor` kept. Deliberate trade-off:
dynamic `color={x}` where `x` is a plain CSS name with no token
(e.g. `'white'` — dangling reference, no `colors.white`) no longer
mints and now warns honestly (`ATM-W-MISSING-STYLE-PLAN`) instead of
being silently covered; static sites are unaffected. No new warning
noise in docs (1 pre-existing). Atomic 769, T16 6/6 native.

### B. `ATM-W-MISSING-CONTAINER-ROOT` in docs is a false positive
The reviewer's memory is correct: the reset/global **does** provide the
container root. Both lib and docs emit, inside the upstream `reference-ui`
global block:

```css
body { ...; container-type: inline-size }
```

(`packages/reference-docs/.reference-ui/react/styles.css:455`, inside
`@layer reference-ui` at :451 — i.e. inherited from lib, which is the
"handled by lib unless you opt out" contract working as designed.)

The warning is a check-scope bug: `check_container_root`
(`atomic/src/resolve/conditions/mod.rs:51`, called from
`assembly.rs:67`) inspects only the **pre-merge** `BaseSystem.global_css`.
The inherited body rule arrives later, at assembly, via neo's streams
merge (`mergeStreams` upstream reprint) — so the check cannot see it and
fires anyway. Docs also emits 101 `@container` rules (88 inherited from
lib), all genuinely rooted at `body` at runtime.

Fix direction (not in this change): run the check against the merged
streams, or suppress it when any extends/layers upstream contributes a
container root. Until then, this warning should be read as noise on any
consumer that extends lib.

---

## Merge log (2026-10-07 — all crews home, verified at merge)

- **#1 (MCP dangling import) — FIXED.** Script now parses the generated
  barrel statically; 3857/3857 names identical to the deleted list,
  script exit 0, MCP icon tests 12/12. Noted: a fresh metadata fetch
  currently returns fewer tags (upstream Google Fonts drift) — the JSON
  was deliberately left byte-identical; regen is a separate decision.
- **#2 (alias mirror divergence) — FIXED.** Mirror fails closed on
  shadowed alias names (per-scope opaque set + const-kind check,
  innermost-wins); peel reconciled onto the extract's `peel`; 4 new
  regression tests incl. the review's param-shadow case. Residual gap
  (catch params/imports untracked) documented and accepted. Atomic
  764 green, `agentrs q` 0 violations.
- **#3 (lockfile churn) — FIXED.** Lockfile is now pure +76/−0 (two
  importer blocks only); frozen-lockfile check passes.
- **#4 (changesets) — FIXED.** `.changeset/icons-drop-jsx-names.md`
  (patch — module was never exported) and
  `.changeset/lib-layer-icons-base.md` (minor — CSS output change).
  The pre-existing `changeset status` failure (stale `@matrix/lib`
  ignore) was separately fixed by removing that line — `changeset
  status` now exits 0.
- **#5 (layers coupling) — DELIBERATE + PINNED.** T16 gained a 6th e2e
  test: icons rules arrive exactly once (count floats with the icons
  compile, duplicates fail). Hermetic 6/6 + unit 4/4.
- **#6 (stripped icon props) — VERIFIED.** `view-story` captures across
  Icon/Listbox-via-Combobox/Collapsible: all shells render correctly
  (Active Status 16px, wrapper-ml 12px measured, Combobox check crisp,
  chevron rotates). Contract documented in the icons README
  ("wrap, don't prop"). One pre-existing Book-dev `lineHeight: "0"`
  warning observed; served CSS backs the rule — gallery artifact,
  out of scope.
- **#7 (fixture bootstrap symlink) — ACCEPTED AS-IS.** Private-fixture
  pattern, build order encoded; flagged not to migrate.
- **Smaller notes:** T16 unit strengthened (4th structural test;
  `renderToStaticMarkup` rejected — duplicate React copies under
  vitest, documented); prefix allow-list now derived from the `@layer`
  prelude with a closed world on `material-symbols*` (fails loud
  otherwise); `repoSourceExcludes` comment kept; `AliasCollector`
  assessed — do NOT dedupe (per-source edges vs merged bag is
  load-bearing); T16 counts bumped to 6/6 e2e, 4/4 unit (gate: 39 e2e
  / 12 entries); `FONT_WEIGHT_RESOLUTION.md` moved to `docs/bugs/`.
- **Addendum A (harvest over-mint) — FIXED.** Color-harvest allowlist
  (tokens + `currentColor`/`transparent`/CSS-wide keywords); observed-
  values explicitly rejected. Icons 220→7 rules (31.3→12.1 KB), docs
  343.6→299.1 KB, junk 0, atomic 769, T16 6/6 native, no hermetic per
  HQ scope call. See corrected §A above for true counts + the `white`
  trade-off.
- **Addendum B (container-root warning) — FIXED.** Neo computes
  `upstreamContainerRoot` from extends/layers published streams
  (`system/base/container-root.ts`, 6 unit tests) and carries it on
  the compile request (drops when unset — SYNC-04 pin green). Docs
  sync: 2 warnings → 1 (only pre-existing CodeBlock), CSS
  byte-identical with the flag on/off (proven by forced-off run).

---

## Verdict

Architecture and test intent are solid; the aliasing fix is the right kind of
general. The three items I'd genuinely block on are #1 (broken MCP script), #2
(mirror/extract alias divergence, at least pin it), and #5 (visual verification
of the stripped icon props). #3 (lockfile) is hygiene you'll regret skipping.
