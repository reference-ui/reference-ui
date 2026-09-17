# Consumer import coverage — Book, CT, matrix, lib tsconfig

Read-only scout, 2026-09-17. Census of every consumer import specifier rooted
at `@reference-ui/react`, `@reference-ui/system`, `@reference-ui/styled` across
the four in-scope surfaces, each mapped to the PLAN §4.1 target inventory
(`packages/reference-neo/PLAN.md` §4.1, derived from
`docs/evidence/generated-folder-shape.md` §7). Complements
`generated-folder-shape.md` §3 (which covered lib `src/` + matrix value
imports); this report owns Book, CT (Playwright), matrix entry/config
resolution, and lib tsconfig.

Scope note: "CT" is `packages/reference-lib/playwright/` (component-test
harness: `main.tsx`, `vite.config.ts`, `runtimes/`). There is no other CT
tree in the repo.

## 1. Summary

Consumers use exactly **four bare specifiers**: `@reference-ui/react`,
`@reference-ui/react/styles.css`, `@reference-ui/system`,
`@reference-ui/system/baseSystem`. All four resolve to files that PLAN §4.1
lists as expected. `@reference-ui/styled` (and `styled/jsx`, `styled/*`)
appears **only** in resolver configuration (lib tsconfig paths, Book vite
alias) — never as a value import on any in-scope surface — so the §4.1
forbidden list (`styled/css/`, `styled/jsx/`, `styled/patterns/`,
`styled/helpers`, `styled/css.mjs`, `styled/global.css`) is safe to enforce;
only out-of-scope internals (generated `react.mjs`, `materialize-runtime.mjs`)
still reference those paths and must move in lockstep. One resolver
divergence needs a decision: Book's vite alias points `@reference-ui/system`
at core *source* (`packages/reference-core/src/entry/system.ts`), while
tsconfig points it at the *generated* folder — see F6.

## 2. Inventory table (specifier → §4.1 item)

| # | Specifier | Book | CT | Matrix | lib tsconfig | §4.1 target file(s) | Verdict |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| 1 | `@reference-ui/react` | 3 | 0 | 50 (+4 in-test strings) | `paths` → `./.reference-ui/react` | `react/package.json` (exports `.`), `react/react.mjs`, `react/react.d.mts` | covered — D5 |
| 2 | `@reference-ui/react/styles.css` | 1 | 1 | 29 | `paths` + `src/global.d.ts` module decl | `react/styles.css` (copy of `styled/styles.css`) | covered — D5, §4.4 |
| 3 | `@reference-ui/system` | 0 | 0 | 10 (+4 in-test strings) | `paths` → `./.reference-ui/system` | `system/package.json` (exports `.`), `system/system.mjs`, `system/system.d.mts` | covered — D6 |
| 4 | `@reference-ui/system/baseSystem` | 0 | 0 | 1 (+1 in-test string) | via `system` dir (no dedicated entry) | `system/baseSystem.mjs`, `system/baseSystem.d.mts` | covered — D5 exports map |
| 5 | `@reference-ui/styled` | 0 (alias only) | 0 (inherited alias) | 0 | `paths` → `./.reference-ui/styled` | `styled/package.json` only (data package; D4) | config-only — no value import anywhere in scope |
| 6 | `@reference-ui/styled/jsx`, `@reference-ui/styled/*` | 0 (alias only) | 0 | 0 | `paths` entries | **forbidden** (`styled/jsx/`, `styled/css/`, `styled/patterns/`, …) | retire — zero backing imports |

Named values observed (spot, not exhaustive): Book imports `Div` + shell tags
(`Aside`, `Header`, `Nav`, `Main`, `Button`, `Input`) from react; matrix
imports primitives plus `css` / `recipe` from react, and `tokens`, `font`,
`keyframes`, `globalCss` (+ `getRhythm`, config types in distro) from system;
`baseSystem` from `system/baseSystem` (distro contract test only).

## 3. Counts and commands

All counts are `rg` match-lines from the repo root on 2026-09-17, excluding
build output and vendored trees. "Real" = import statement; "in-test string"
= specifier embedded in a double-quoted fixture string inside a matrix test
(pins the contract, does not resolve a module).

Book (`packages/reference-lib/book`, excl `dist/**`):

- `rg -N "from '@reference-ui/react'" packages/reference-lib/book --glob '!dist/**'` → **3**
  (`decorator/BookDecorator.tsx`, `app/BookCanvas.tsx`, `app/BookShell.tsx`).
- `rg -N "import '@reference-ui/react/styles.css'" packages/reference-lib/book --glob '!dist/**'` → **1** (`decorator/BookDecorator.tsx`).
- `rg -N "@reference-ui/system|@reference-ui/styled" packages/reference-lib/book/app packages/reference-lib/book/decorator packages/reference-lib/book/discovery packages/reference-lib/book/main.tsx` → **0** (styled/system appear only in `book/vite.config.ts` aliases).

CT (`packages/reference-lib/playwright`, excl `test-results/**`, `playwright-report/**`):

- `rg -N "import '@reference-ui/react/styles.css'" packages/reference-lib/playwright --glob '!**/test-results/**' --glob '!**/playwright-report/**'` → **1** (`main.tsx`).
- `rg -N "from '@reference-ui" packages/reference-lib/playwright --glob '!**/test-results/**' --glob '!**/playwright-report/**'` → **0**.
- `rg -N "@reference-ui/(react|system|styled)" packages/reference-lib/playwright/runtimes/` → **0**. `playwright/vite.config.ts` re-exports the Book config, so CT inherits the Book aliases.

Matrix (`matrix/`, excl `**/node_modules/**`, `**/dist/**`, `**/test-results/**`):

- `rg -N "from '@reference-ui/react'" matrix --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**'` → **54** = 50 real + 4 in-test strings (`watch-contract.spec.ts` ×2, `distro.test.tsx` ×1, `virtual-output.test.ts` ×1).
- `rg -N "import '@reference-ui/react/styles.css'" matrix --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**'` → **29**, one per suite `src/main.tsx` (incl. `chain/T*`).
- `rg -N "from '@reference-ui/system'" matrix --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**'` → **14** = 10 real + 4 in-test strings (`watch-contract.spec.ts` ×2, `tokens-output.test.ts` ×1, `distro.test.tsx` ×1).
- `rg -N "@reference-ui/system/baseSystem" matrix packages/reference-lib --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**' --glob '!**/playwright-report/**'` → **2** lines, both in `matrix/distro/tests/unit/distro.test.tsx` (1 real import, 1 node `-e` probe string asserting `Div`, `css`, `baseSystem.name === 'distro'` resolve at runtime).
- `rg -N "@reference-ui/styled" matrix --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**'` → **0**.
- `rg -N 'from "@reference-ui/(react|system|styled)' matrix --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/test-results/**'` → **0** (no double-quote imports).

lib tsconfig (`packages/reference-lib/tsconfig.json`): 7 `paths` entries —
`@reference-ui/react`, `@reference-ui/react/styles.css`, `@reference-ui/styled`,
`@reference-ui/styled/jsx`, `@reference-ui/styled/*`, `@reference-ui/system`,
`@reference-ui/types` — with `include` covering `src/**`, `book/**`,
`playwright/**`, so Book and CT typecheck through these mappings.
`src/global.d.ts` declares `module '@reference-ui/react/styles.css'`.

Resolution cross-checks:

- `rg -N "@reference-ui" matrix/reference/tsconfig.json matrix/system/tsconfig.json matrix/css/tsconfig.json` → **0**: matrix suites carry no tsconfig paths; they resolve via `matrix/<suite>/node_modules/@reference-ui/{react,styled,system,types}` symlinks into `matrix/<suite>/.reference-ui/*` (observed in `matrix/reference` and `matrix/system`), with `package.json` depending only on workspace `@reference-ui/core` + `@reference-ui/lib`.
- `book/vite.config.ts` aliases: `react/styles.css` → file, `styled/` + `styled` → dir, `system` → core source `src/entry/system.ts`, `react` → `react.mjs` (literal filename).

## 4. Findings

- **F1. Four live specifiers, all in §4.1.** Every value/side-effect import on
  all four surfaces targets rows 1–4 of the table; each maps to an expected
  §4.1 file. Nothing in scope imports a path §4.1 forbids.
- **F2. Book is react-only.** 3 value imports (primitives) + 1 stylesheet
  import; no system or styled imports outside `vite.config.ts`.
- **F3. CT is stylesheet-only.** The only specifier is `react/styles.css` in
  `playwright/main.tsx`; all other resolution is inherited from the Book vite
  config. CT proves the `./styles.css` export shape, nothing else.
- **F4. Matrix is the only consumer of `system` and `system/baseSystem` in
  scope** (10 + 1 real imports), and the only surface importing `css`/`recipe`
  from react — consistent with `generated-folder-shape.md` §3.2 (lib `src/`
  uses primitives + `recipe`, never bare `css`).
- **F5. `styled/jsx` and `styled/*` tsconfig entries are dead config.** Zero
  value imports back them on any surface; the only remaining references are
  out of scope (generated `react.mjs` bundling `@reference-ui/styled/css`,
  `scripts/materialize-runtime.mjs` rewrite table). They exist for Panda's
  outdir and must go with it.
- **F6. Book vite alias bypasses generated `system.mjs`.**
  `book/vite.config.ts` maps `@reference-ui/system` to
  `packages/reference-core/src/entry/system.ts` (core source), while lib
  tsconfig maps the same specifier to `./.reference-ui/system` (generated).
  Under D6 the authoring APIs live on generated `system/system.mjs`; the Book
  alias must move there too, or authors get two `tokens()` implementations
  depending on which resolver wins. (Book has no system imports today, so
  nothing breaks yet — the trap is latent.)
- **F7. Filenames are load-bearing.** Book vite aliases `react` to the literal
  `react.mjs` file and `react/styles.css` to a file path; distro's runtime
  probe imports both bare specifiers through node resolution (package
  `exports`). This pins D5: the react entry must stay `react.mjs` (not Neo's
  current `index.mjs`) with `exports` for `.` and `./styles.css`, unless every
  resolver moves together (cf. `generated-folder-shape.md` §7 item 10).
- **F8. In-test strings pin the contract.** The 9 embedded-string occurrences
  (`watch-contract`, `tokens-output`, `virtual-output`, `distro`) assert on or
  execute the specifiers `react`, `system`, `system/baseSystem` — the NEO-SYNC
  parity census (W4) must treat these as contract pins, not ignore them as
  non-imports.

## 5. Implications for Neo (hand-off to W2 SYNC / W4 PARITY)

- **I1.** `NEO-SYNC-02`'s `OutputInventory` assertion should resolve exactly
  rows 1–4 (plus `node_modules/@reference-ui/*` links) and assert rows in the
  forbidden list absent — this report is its consumer-evidence input.
- **I2.** `NEO-SYNC-05` (D5 filenames): keep `react/react.mjs`,
  `react/react.d.mts`, `react/styles.css`, `system/system.mjs`,
  `system/baseSystem.mjs`; update `exports` for `.`, `./styles.css`,
  `./baseSystem`. Do not ship Neo's `index.mjs` naming without moving the Book
  alias (F7).
- **I3.** `NEO-SYNC-12` (D6 authoring surface): `system/system.mjs` must export
  `tokens`, `font`, `keyframes`, `globalCss`, `getRhythm` (+ config types);
  decide F6 (Book alias → generated `system.mjs`) in the same slice.
- **I4.** `NEO-SYNC-13` (D4): `css`/`recipe` bind in the react bundle; nothing
  in scope imports executable code from `styled`, so moving the binding out of
  `styled/css.mjs` breaks no consumer — only Neo's own `publishReactBundle`
  wiring.
- **I5.** tsconfig follow-up (captain-owned, touches `reference-lib` config):
  drop `styled/jsx` and `styled/*` paths when the Panda outdir dies; keep the
  bare `styled` path only if `styled/package.json` keeps a `.` export for the
  data files. Same for the Book `styled` aliases.

## 6. Out of scope (not re-probed)

- lib `src/` value imports (owned by `generated-folder-shape.md` §3:
  91 × `react`, 31 × `system`, 0 × `styled`; spot re-run 2026-09-17 returned
  the same 91/31, but lib `src/` is outside this census's scope).
- `src/index.ts` re-export of `baseSystem` via relative path
  (`../.reference-ui/system/baseSystem.mjs`) — not a bare specifier.
- `scripts/materialize-runtime.mjs` / `build-package.mjs` rewrite tables and
  generated `react.mjs`'s internal `@reference-ui/styled/css` import —
  internals that must move in lockstep (I4/I5), not consumer contracts.
- `@reference-ui/types`, `@reference-ui/core`, `@reference-ui/icons`,
  `@reference-ui/lib` specifiers — different packages, not in the
  react/system/styled brief.
- Matrix `.reference-ui` symlink creation mechanism (`linkGeneratedPackages`)
  and suite-local `matrix.json`/`ui.config.ts` — resolution internals, not
  import specifiers.
- Downstream apps outside this repo: none exist (`apps/` absent); no external
  consumer census is possible or attempted.
