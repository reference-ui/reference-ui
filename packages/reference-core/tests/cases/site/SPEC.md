# SITE — extraction shapes through Core

SITE proves the extract boundary end to end: which call sites and JSX
shapes become utilities in a synced world, and which fail closed with a
diagnostic and no ghost class. The engine (Atomic extract + styletrace)
decides what is a site; Core proves the decision paints — or provably
paints nothing — in a browser. Host surface is small:
`src/config/types.ts` carries `include` (what gets scanned) and
`jsxElements` (which tag names are hosts).

## Dialect

Authors write `css()` / `css.object()` calls (single- and multi-arg),
local `const` style objects, identifier spreads, literal ternaries and
`&&` spreads, import aliases (`css as c`) and namespaces (`ui.css`), and
StyleProps on primitives or configured `jsxElements` hosts — including
`css={{}}`, `_hover={{}}`, and boolean attrs (`<Div border />`). A local
function named `css` is not a site; dynamic call values (`color:
pick()`) warn and skip without erasing static siblings.

## Reference-rs cases

All confirmed present (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-SITE-01..18
(13 with RS-5, 17 with RS-14, 18 with RS-19),
ATM-LEAF-07, ATM-FORBID-02, ATM-COND-11. Key leans:
SITE-05 (both ternary arms), SITE-06/11/16 (const / spreads /
cross-file), SITE-08 (styletrace + imports, never PascalCase),
SITE-10/15 (import-bound identity), SITE-14 (css prop), LEAF-07 +
FORBID-02 (dynamic warn-and-skip), COND-11 (string `@media` is an
at-rule). ATM-SITE-13 is the empty-host-set fail-closed diagnostic
(RS-5), proven by CORE-SITE-14; ATM-SITE-18 is the boolean
`border` macro (RS-19), proven by CORE-SITE-13. ATM-SITE-53 is
scope-aware identifier resolution, proven by
CORE-SITE-27. ATM-SITE-55 is re-export identity,
proven by CORE-SITE-28.

## Decisions

(literal ternary arms both compile, runtime picks; dynamic values
diagnose, never ghost; hosts from imports + `jsxElements`, never
PascalCase) governs SITE-01/06/12. RS-1 (frozen
`NativeCompileRequest` carries `jsxHosts`) governs SITE-11: the host
list travels on the frozen request, not a private shape.

## Approved absences

- **Tagged templates** (`` css`…` ``): engine case only (ATM-SITE-12
  refuses: no wants, one located diagnostic on a live `css` binding —
  the no-silence sweep revoked the old "no diagnostic" note); no
  dedicated browser case (CORE-SITE-24 covers the tag beside the arg
  shapes) — the object form is the only author API.
- **Vue/Svelte**: Panda extracts SFCs; Core worlds are source TSX for
  React 19 only.
- **Compiled JSX runtimes** (automatic-runtime helpers): worlds are
  source TSX, not bundled output.
- **`importMap`**: Panda remaps `@pandacss/dev` outdir imports; Core
  scans Reference runtime imports only (no config field, deliberate).
  Identity still follows consumer re-exports by binding (CORE-SITE-28) —
  zero config, not a remap.
- **`matchTag` / PascalCase guessing**: anti-goal; CORE-SITE-12 proves
  the opposite (unlisted `<Random>` is not a host).
- **`token()` inlining**: Panda parse-time hex eval; Reference authors
  write `{path}` refs (TOKEN group).
- **`css.raw`**: Panda composition API; Core has `css.object()` plus
  plain objects.
- **Whole-object `css(styles)`**: passing an entire const object as the
  call argument emits nothing but diagnoses (ATM-SITE-50 /
  CORE-SITE-24 claimed the old silent 0/0/0/0; RS-14 covers arms/member/
  spread only). Authors inline, spread, or select members (SITE-01/02/03).
  Whole-object resolve rides the fold work.
- **Element-access refusal**: reads (`map['k']`, `map[key]`, computed map
  keys) refuse with a `Dynamic non-literal expression` diagnostic (S1
  probes O1/O2/O3); member access is the only indirection (SITE-02).
- **Computed-key refusal**: computed keys in style objects and
  template-literal values refuse with diagnostics (O4 `Dynamic computed
  property key…`, O8 `Dynamic non-literal template expression…`).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| `styled()` factory / `styled.div` | Core primitives, not Panda factory |
| Patterns pack (`stack`, `box`, `cq`) | Not shipped |
| `cva` / `sva` as author APIs | Core `recipe()` (RECIPE group) |
| `syntax: 'template-literal'` | Refused by ATM-SITE-12 |
| `jsxFramework` / `jsxStyleProps` modes | One React; explicit `jsxElements` list |
| `strictTokens` / `strictPropertyValues` | Type-level, no browser case |
| `staticCss` config | No Core field (STATIC group covers pre-generated atoms) |

## Appendix: dependent-invalidation design (from CORE-SITE-28)

Filed with CORE-SITE-28, whose binding walk motivates it: once the walk
lands, files depend on each other, so sync needs dependent invalidation.
Verbatim from the case README.

## Sync rider: dependent invalidation — design note

### 1. Problem

Sync compiles single-shot today: collect files, extract, print. Once the
binding walk lands, files depend on each other — an edit to
`tokens.ts` changes what `App.tsx` extracts, and an edit to a wrapper
(`ui.ts`) flips which of its importers' calls are sites at all. Without
dependent invalidation the next sync either recompiles the world (slow)
or serves a stale sheet (wrong). This note files the invalidation
design the exit requires. The walk is not the whole dependency
story: merge-bag fallback reads (§3b) and file-set changes (§6) need
their own edges, or the reverse index is incomplete by construction.

### 2. Edges the resolver knows

Three walked/refused shapes, plus the fallback reads that rev 1 missed:

- Walked value edges: `(importer, local)` → `(origin file, declared
  name)` plus the trail of declared names along the hops. The existing `Resolved` already carries origin + trail (for mutation poison); the
  reverse index reuses it. Complete for named imports the walk hits —
  values, descriptors, and re-export chains alike.
- Walked identity edges: `(importer, local)` → Reference export plus
  the wrapper chain walked, recorded per import so a wrapper edit
  re-gates site discovery for exactly its importers. Identity has no
  fallback (an unbound `css` is a non-site by definition, and only a
  same-file edit or a walked wrapper change can flip it), so walked
  edges alone are complete here.
- Refused shapes (NOT edges): default imports, namespace imports,
  unresolvable specifiers, missing exports, and cycles each answer
  `None` from the walk. Rev 1's "a default hop is one ordinary named
  edge" was wrong and is struck: `resolve_import` returns `None` for
  `default`/`*`, and `exports.rs` never records default exports, so a
  default import is a fallback read (§3b), never a walked edge. Stars
  likewise need no invalidation until the namespace rider lands — they
  always diagnose today, independent of target content; if the rider
  builds `t.brand` resolution, stars become ordinary walked edges.
- Fallback reads (major-1 hole, now tracked — §3b): every merge-bag
  read the scope chain serves when the walk misses or the name is
  unbound — `scalar_leaves`/`object`/`object_prop`/`array` for
  Import-miss and Unbound lookups, plus the name-wide mutation-poison
  reads. The helper fix removed `PureFn` from the bag, so helper
  calls never fall back (an import answers only its walked origin, an
  unbound callee refuses with a diagnostic) and helper edges are
  complete by construction. Value fallbacks remain load-bearing (SITE-28
  `app.ts` reads `glow` bare through the bag) and MUST be tracked: an
  edit to a fallback contributor otherwise serves stale to its readers
  with no invalidation, and edge-completeness fails.

All walks are cycle-guarded with a visited set; all miss shapes answer
`None` fail-closed and become either fallback reads (§3b) or negative
edges (§6).

### 3. Algorithm

- Reverse index: origin file → dependent files, built alongside the
  forward walk over walked edges (§2), fallback edges (§3b), and
  negative edges (§6).
- Change detector: content hash per file, computed at collect time and
  stored in the prior-sync index. Rev 1's "targets already parse once
  per content hash" was false and is struck: nothing hashes today —
  `cache.rs` is a per-compile `(file, export)` map with no hashes and
  no cross-compile persistence, and externals load fresh every compile.
  Hashing must be built (§5); mtimes never decide, so no mtime races.
- On change set C: dirty = C plus transitive reverse dependents
  (visited set, cycle-safe). Re-collect export surfaces for dirty
  files, recompile the dirty set against the warm cache, rebuild the
  sheet from all wants.

### 3b. Fallback edges (major-1 fix)

During extraction the lookup knows exactly when it fell back (the
`ImportLookup::Binding` fallback path, the `ProjectBag` path) and which
name it read. Record each as `(reader file, name)`; a name→files index
built at collect time (invert the per-file bags' keys: which files
declare this name) resolves it to contributor files, and the reverse
index maps each contributor → its readers. Mutation-poison reads ride
the same index (a write appearing or disappearing in any contributor
flips poison for every reader of that name). Granularity is name-level:
coarse enough to stay cheap (one inverted index per sync), precise
enough that editing an unrelated file never invalidates a fallback
reader. File-level fallback (any fallback-relevant change invalidates
the world) is the fallback's fallback — correct, kept only if the
name index ever proves too dear. Helpers need no entries here: no bag,
no fallback, no edge — complete by construction (§2).

### 4. Identity vs value invalidation

- Value change (a const edit in `tokens.ts`): importers' leaves change;
  their site sets do not. Re-resolve values, keep bindings.
- Fallback-contributor change (an edit to any file declaring a
  fallback-read name): re-read the slice for every reader in §3b's
  reverse map. Same machinery as value changes, contributor-granular.
- Wrapper change (an edit in `ui.ts`): importers' BINDINGS may change.
  Re-run binding collection and site discovery for every importer: a
  removed `export { css }` turns live calls into silent non-sites, and
  their utilities must LEAVE the sheet — which is why the sheet
  rebuilds rather than patches.
- Stars need no conservatism rule today (refused, always diagnose —
  §2); the rider that resolves them inherits ordinary walked-edge
  invalidation.

### 5. Cache keys

Nothing below hashes today (correcting rev 1) — every hash is built
with this rider:

- File content hash: computed at collect time over the read bytes
  (externals included — `load_externals` already reads them, so hashing
  is free), stored in the prior-sync index (§6).
- Export surface: `(path, content-hash)` — re-parse and re-collect the
  file when its hash moves.
- Resolved value: `(path, export)` plus the hashes of every file on its
  walk trail (v2's `deps` shape: a dep hash miss busts the entry, so
  `export { brand } from './tokens'` never keeps the old value).
- Traced identity: `(importer, local)` plus its wrapper-chain hashes;
  any chain edit re-walks that import.
- Fallback slice: `(name)` plus its contributors' hashes; any
  contributor change re-reads every reader's slice.
- Negative: `(importer, specifier, imported)` recorded on every walk
  miss; re-probed when the file set grows (§6).

### 6. File-set changes (major-2 fix; was an open question)

- Set-diff detector: the prior-sync index persists the file list with
  hashes (§5). Each sync lists the current files and diffs: changed →
  §3 dirty; added and removed → below.
- Added files: probe the negative edges — every retained
  `(importer, specifier, imported)` miss (v2's "failed resolutions are
  retained as requests", including nested misses stored on cached
  exports) re-resolves against the grown set, and any hit dirties its
  importer plus transitives. The added file itself compiles fresh (it
  may import and be imported).
- Removed/renamed files: dirty every importer with a walked, fallback,
  or negative edge touching the path. Their specifiers now dangle
  (resolve to `None`); they recompile to diagnose, never silently hold
  stale — silence is a behavior change.
- Full-recompile alternative: any add/remove recompiles the world and
  skips negative edges entirely. Correct with the least machinery, but
  file churn (checkout, branch switch) pays full builds. Recommendation:
  ship full-recompile first, graduate to negative edges when churn
  dominates profiles. The exit needs the design, not the build — this
  note files both, and either satisfies it.
- Persistence, explicit: the prior-sync index (file list, hashes,
  reverse walked/fallback edges, negative edges, export surfaces) lives
  in the sync daemon's memory for watch mode; a daemon restart loses it,
  so the first sync after restart is a full compile that rebuilds it.
  One-shot CLI syncs keep no prior index and always compile whole —
  correct by construction. No disk serialization in v1 (stale-on-disk
  hazards exceed the win; revisit if restarts dominate). Config moves
  (`tsconfig.json` / `package.json`) drop the whole index and recompile
  everything — the specifier ladder itself moved.

### 7. Non-goals

- Incremental sheet patching: recompile dirty, rebuild the sheet. The
  sheet build is cheap next to parsing.
- Parallel invalidation: singleflight per file; the existing queue
  already serializes heavy work.
- Value-level diffing: hash equality is the only comparator. A changed
  file recompiles even if its exports are identical.
- Disk-persisted index in v1 (§6); walked namespace/default edges until
  the 76 rider builds them (§2).

### 8. Open questions (two left)

- Watcher plumbing: sync daemon vs bundler plugin — who owns the watch
  loop and the reverse index lifetime?
- Granularity: file-level reverse index to start vs `(path, export)`
  level (fallback edges are already name-granular per §3b; walked edges
  graduate when profiles say so).
