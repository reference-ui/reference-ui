# Atomic overnight plan — 2026-09-15

**Status 02:27:** SPEC **75 / 75**. Closed `@layer recipes` emit is back. Named
contract is ticked. Not committed. Morning leftovers are host wiring, not
missing `ATM-*` IDs: fragments → BaseSystem JSON, lib `globalCss` chrome
(button `_hover` in `@layer global`), styletrace needing a real primitive
graph (empty host set still falls back to pre-gate scan), typegen.

Get atomic into a much better place by morning. Two tracks. Track A is the
blocking architecture move. Track B ticks SPEC cases that do not need Track A.

Contract: [SPEC.md](./SPEC.md). Workflow: `.agents/skills/agent-rs/SKILL.md`.
Quality after every generation: `pnpm agentrs q <path>`.

Tonight we are **not** finishing `modules/base-system` (43 `BAS-*` cases,
`extends` / `layers`, fragment evaluation). We are **not** wiring
`reference-core/src/lib/fragments`. JS still owns producing a dump later.

---

## Verdict (do not reopen)

Atomic `src/config` is a second dialect. Kill it. The utterance lives in
`modules/base-system`. Atomic compiles sources against that artefact.

Fragments are a future seam. Tonight BaseSystem is a **typed bag** plus a
**frozen `@reference-ui/lib` fixture** copied from:

- `packages/reference-lib/src/core/theme/colors.ts`
- `packages/reference-lib/src/core/theme/design.ts`
- `packages/reference-lib/src/core/theme/primitives/tokens.ts` (`ui.*`)
- `packages/reference-lib/src/core/theme/radii.ts`
- `packages/reference-lib/src/core/theme/fonts.ts`
- `packages/reference-lib/src/core/theme/animations/tokens.ts`
- `packages/reference-lib/src/core/theme/global.ts` (`--spacing-root` on `:root`)

Last night's drop-in looked "almost right" because extract → utilities already
works on literal JSX. Basic things like `_hover` still failed for two reasons:

1. **Wrong host selector.** Atomic lowers `_dark` to `.dark &`. Primitives stamp
   `data-panda-theme`. That is `ATM-COND-08`. The lib fixture's condition map
   must match the DOM.
2. **Two hover machines.** StyleProps `_hover` on `<Div>` is `ATM-COND-02`
   (utilities). Lib chrome (`button.ts`, field, tables) is `globalCss({
   '.ref-button': { _hover: … } })` — `@layer global`, `ATM-LAYER-03`. Copying
   **tokens** unblocks token lookup and condition wraps. Primitive chrome hover
   needs globalCss in the dump. Do tokens + conditions + fonts + `:root`
   spacing first. GlobalCss chrome is Track A+ if time.

`compile()` takes `Option<BaseSystem>`; omitted uses `lib_fixture()`. Token
resolve is dictionary lookup. `_dark` wraps `[data-panda-theme=dark]`. `src/config`
is gone. Remaining hole: print `@layer tokens` / globalCss chrome, plus leftover
condition stations.

---

## Track A — BaseSystem ingest (landed)

`atomic/src/config` deleted. `CompileRequest.base_system: Option<BaseSystem>`.
`None` → `lib_fixture()`. `ATM-COND-08` ticked. Named `sm` lowers to
`@container`. Fixture `global_css` is stored, not printed. **COND-01 folder
still missing** (A+).

## Track A (original brief)

### Shape

`packages/reference-rs/modules/base-system` owns:

```text
BaseSystem
  name
  tokens          nested category maps → indexed lookup
  fonts           sans / serif / mono + weights + css extras
  breakpoints     sm/md/lg/xl/2xl widths
  conditions      _hover / _dark / _groupHover / … → wrap strings
  global_css      optional; :root --spacing-root tonight; chrome later
  keyframes       empty ok
  recipes         empty ok
```

Query methods atomic actually calls tonight:

- `is_token` / category / `css_var` / light+dark value
- `get_condition("_hover")` → wrap string
- `breakpoints()` ordered names + widths
- `fonts()` table (family, weights, css.letterSpacing)

`BaseSystem::lib_fixture()` (or `reference_lib()`) returns the frozen copy.
`BaseSystem::default()` stays empty (`BAS-DUMP-01`).

Prove with Cargo tests in this crate, not through core sync:

- empty default
- lib fixture has `colors.gray.800`, `colors.ui.*`, `radii.md`, fonts
- `_dark` wrap is `[data-panda-theme=dark] &` (not `.dark &`)
- `_hover` wrap is `&:is(:hover, [data-hover])`
- `Send + Sync`

Do **not** implement `from_json` fragment dumps, `extends`, `layers`,
`staticCss`, closed recipes, or a JS evaluator.

### Kill `atomic/src/config`

Delete the module. Atomic `Cargo.toml` depends on `base_system`.

`CompileRequest`:

```text
root_dir, files, base_system: Option<BaseSystem>
```

Drop parallel `breakpoints` / `tokens` / `fonts` / `BaseSystemConfig` fields.
`None` → `BaseSystem::lib_fixture()` so existing stations keep compiling
against the first real utterance.

Move `BreakpointScale` / font lookup types into `base_system` (or keep thin
views on `BaseSystem`). Update every `crate::config::` import in atomic.

Token resolve: look up the fixture dictionary. Keep `color-mix` opacity and
`{colors.gray.800}` brace stripping in **atomic**. Heuristic
`KNOWN_CATEGORIES` dies once lookup works. Unknown paths pass through as raw
CSS + diagnostic (fail closed, not silent drop).

Condition lowering: named `_` keys ask BaseSystem first; fall back to the
existing preset table only for keys the fixture does not list. After the
fixture lands, `_dark` / `_light` come from the dump → update `ATM-COND-03`
goldens to `[data-panda-theme=…]` and tick `ATM-COND-08`.

### JS seam

`packages/reference-rs/modules/atomic/js/types.ts`: `CompileRequest.baseSystem`
is the dump. Remove the old config-shaped fields. N-API stays `compileSystem`.

### Verify Track A

```bash
pnpm agentrs q packages/reference-rs/modules/base-system
pnpm agentrs q packages/reference-rs/modules/atomic
pnpm agentrs c base_system
pnpm agentrs c atomic
pnpm agentrs v atomic
```

Goldens that only used `blue.600` / `2r` should still match. `_dark` goldens
will change — that is COND-08, not a regression. Use
`pnpm agentrs v atomic --update-goldens` only for goldens whose CSS wrap
honestly changed.

Update SPEC counts when COND-08 ticks.

---

## Track B — Independent SPEC ticks (landed 2026-09-15)

31 stations on disk. SPEC ticked by parent after the case agent finished so
Track A would not race the proof map. Src: identifier spreads
(`ATM-SITE-11`) plus `LocalConstants::get_object`.

Do **not** retake these IDs. Do **not** revert SPEC `[x]` rows for them.

| ID | What |
| :--- | :--- |
| `ATM-SITE-04` | unknown helper is not an extract site |
| `ATM-SITE-09` | `<Div border />` → Bool(true) |
| `ATM-LEAF-06` | computed key diagnostic |
| `ATM-LEAF-09` | authored `2r!` → `mt_2r!` |
| `ATM-WANT-01` `ATM-WANT-02` | Want builder + serde |
| `ATM-ATOM-01`–`04` | Atom hash, AtomValue, AtomSet, one grain |
| `ATM-RHYTHM-04` | `1px solid 1/3r` pass-through |
| `ATM-SHORT-03`–`05` | zero/whole borders, longhand tripwire, dimensional counts |
| `ATM-NAME-01`–`05` | class spelling + CSS escapes |
| `ATM-DIAG-01`–`03` | clean diagnostics / locations / parse error no panic |
| `ATM-LAYER-02` `ATM-LAYER-04` | empty layers; utilities encapsulation |
| `ATM-FORBID-01`–`05` | hash / eval / second namer / no css.js / no private tables |

Do **not** take in Track B: `ATM-TOKEN-05`, `ATM-LAYER-03`, `ATM-STATIC-*`,
`ATM-RECIPE-*`, `ATM-SITE-08` (styletrace), `ATM-COND-01/07/08/09` until
Track A has landed the fixture. `ATM-SITE-06` / `ATM-SITE-11` (local const
objects / `{...base}`) are high value for "hover didn't work" on **JSX**
and can land in B if they only need extract.

### Verify Track B

```bash
pnpm agentrs q packages/reference-rs/modules/atomic
pnpm agentrs c atomic
pnpm agentrs v atomic
```

Tick SPEC.md `[x]` + proof map only when the case folder exists and the
station is green.

---

## Track A+ if time (after A is green)

1. `ATM-COND-01` named breakpoints → `@container`
2. `ATM-COND-07` `r={{ 300: { p: '1r' } }}`
3. `ATM-COND-09` `_groupHover` / `_peerFocus` / `&[data-slot]` in the sheet
4. `ATM-COND-05` / `ATM-COND-06` dialect + runtime-owned props
5. `ATM-TOKEN-01`–`04` against the lib fixture (not heuristic)
6. `ATM-SITE-06` / `ATM-SITE-10` / `ATM-SITE-11`
7. Emit `@layer tokens` custom properties from the fixture (`ATM-LAYER-03` slice)
8. Optional: copy a **small** `globalCss` chrome slice (button `_hover`) into
   the fixture so Book primitive hover is not empty. Do not port every
   `globalCss()` file tonight.

Still later (not tonight): fragments → BaseSystem JSON, `extends`/`layers`,
`staticCss` third want source, closed `@layer recipes`, typegen, styletrace
gating of every JSX tag.

---

## Tripwires

- Do not evaluate author JS. Do not add QuickJS.
- Do not invent a second class namer. Ghost class is P0.
- Do not generate `css.js`.
- Do not synthesize `currentColor` on shorthands.
- Do not grow `KNOWN_CATEGORIES` — look up the fixture.
- Do not complete the 43-case base-system SPEC.
- Do not start `pnpm dev:lib`. Do not raw Playwright/Vitest; `pnpm agentrs`.
- `#[allow(clippy::…)]` is banned. Files ≤ 500 lines. Context structs, not
  argument soup.
- CPU gate: at most two `pnpm agentrs` test runs at once.

---

## Morning checklist

- [x] `atomic/src/config` gone
- [x] `compile()` takes `BaseSystem`; default is lib fixture
- [x] `_dark` matches `data-panda-theme` (COND-08 ticked)
- [x] Token lookup for `gray.800` / `ui.*` / `radii.md`
- [x] `@layer tokens` / `global` print from the fixture
- [x] `staticCss` third want source (opt-in dumps; lib fixture empty)
- [x] Closed `@layer recipes` + variant table
- [x] SPEC **75 / 75**
- [x] `pnpm agentrs c base_system && pnpm agentrs c atomic && pnpm agentrs v atomic` green
- [ ] Not committed
- [ ] Fragments → BaseSystem JSON (still a later seam)
- [ ] Lib primitive `globalCss` chrome (button `_hover`) not in the fixture
- [ ] Styletrace empty-host fallback still scans every tag
- [ ] Typegen still a stub
