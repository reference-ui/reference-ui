# STYLE_PROP_EXTERNAL — styling external (prebuilt) components with style props

Status: **implemented — landed across the commit series** (engine + diagnostic + T17 + forwarding + docs revert; side-quests PIPELINE.speed and NEO-CSS-14 fixed). Owner decision recorded below; supersedes the earlier "no repair / BAN" rulings.

**This file is the living planner + log for the fan-out mission.** The captain
appends the task-level plan (§13) when Oracle returns it, and records wave/crew
progress in the captain log (§14). Mission artifacts (Oracle consults + plan
review) live in `.agents/missions/atomic-style-prop-backing/`; the execution-grade
plan is authored by `reports/PLAN.impl.oracle.md`.

---

## 1. TL;DR

- Today, a style prop passed to an **external (prebuilt) component** —
  `<BoltIcon color="diagramRedText" />`, `<Field padding="4r" />` — is silently
  dropped and paints nothing, because the component's runtime mints a class in
  **its own frozen scope** and the consumer's compile never emits that class.
- The **decision** is that this must work: it is one system, a named style prop
  must always paint, the component's outermost element must be stylable, and the
  consumer must be able to override the package default.
- The fix (**fan-out**) is a **moderate** change (~3–5 days), **not** a
  re-architecture and **not** a one-line flag: the consumer compile keeps style
  props on external components, resolves them against the **consumer's** tokens,
  and emits the deterministic class into its **own** sheet. No runtime change, no
  republishing of frozen packages, no new metadata.
- Everything is pinned by a new matrix contract test (**T17**); `T16` stays frozen.

---

## 2. The decision (owner, fixed)

> It is **one system**. You should be able to style external components. An icon
> with a `color` prop should always work. You should be able to style the
> outermost element (padding, margin, …). You can override as well. This is an
> ergonomics requirement.

Supersedes:

- `reports/CONSULT.oracle.md` **F3** — "cross-system wants do not exist; no repair".
- `reports/PLAN.oracle.md` — the **BAN** recommendation for `@reference-ui/lib`.

The contract to move to is therefore:

1. A named style prop on an external component **always paints** (same as on a host primitive).
2. The **outermost element** is stylable (`<Field padding="4r" />`).
3. A consumer value **overrides** the package default.
4. **Ergonomics**: no new API; existing syntax just works.

---

## 3. The problem

### 3.1 How the system composes

Reference UI compiles CSS **at build time**; nothing computes styles at runtime.
Each package (`@reference-ui/icons`, `@reference-ui/lib`, the consumer app) is
built on its own and ships:

- its compiled utilities as **CSS text** (composed downstream via `extends` /
  `layers`), and
- its **own bound runtime** — a copy of `css()` pre-registered to that package's
  system name, with its import rewritten into `dist`.

Evidence:

- `packages/reference-icons/dist/createIcon.mjs:3` →
  `import { Div } from "./runtime/reference-ui/react/react.mjs"`.
- `packages/reference-lib/scripts/materialize-runtime.mjs:34` rewrites
  `dist/index.mjs` to `./runtime/reference-ui/react/react.mjs`.
- Every class is qualified with the **minting** system: `<system>__<stem>`
  (`packages/reference-rs/modules/atomic/js/namer/index.ts:37`, called in
  `packages/reference-neo/src/runtime/css/css.ts:271`).
- A want carries **no target-system**:
  `packages/reference-rs/modules/atomic/src/atom/want.rs:14`,
  `atom/decl.rs:14`.

Net: the docs app (system `reference-docs`) and the icons package (system
`reference-icons`) mint **different class strings for the same declaration**.

### 3.2 The faint (root cause)

`<BoltIcon color="diagramRedText" />` in the docs:

1. The extractor **drops** the prop: style props on a capitalized **non-host**
   JSX tag are discarded when a host graph exists
   (`.../extract/jsx/mod.rs:50`; silent via `report_dropped_tag`, `mod.rs:534`).
   `BoltIcon` is not a host in docs scope, so no consumer want is produced.
2. The icons runtime **mints anyway**: `createIcon` forwards `color` into the
   icons-bound `Div` (`createIcon.mjs:27` → `css.ts:271`), and the namer is
   constructive — unknown tokens still stem (`namer/value.ts:219`).
3. Result: the element carries `reference-icons__c_diagramRedText`, which has
   **no backing rule** anywhere. It "paints nothing", and the dev probe warns
   `no compiled class`.

Oracle's name for the class: **a consumer-authored value minted into a frozen
foreign scope.** One class; not several.

### 3.3 Why it is silent / the poor diagnostic

- The warning (`css.ts:125–136`) prints the *prop: value* but **never the
  constructed class name or its system**, and it **misattributes the call site**
  (names a file that doesn't contain the value).
- Effect: the failure reads like an engine bug or a typo instead of what it is —
  a **scope** mismatch — so it is hard to diagnose from the console alone.

### 3.4 The second trap (`ref-div` default)

The component shell is a `Div`, and a global rule sets its colour:

```css
ref-div { font-family: …; letter-spacing: -0.01em; color: var(--colors-design-text-base); font-size: … }
```

This **defeats inheritance** and the icon's own layered `c_inherit`. So a
coloured **wrapper** around the icon does **not** work; a class must land **on the
element itself** (or in a later layer than the global). Measured:

- wrapper `<span>` blue, child icon `Div` still `design.text.base`;
- a docs class forced onto the icon `Div` **wins** → icon turns blue;
- inline `style="color: …"` also wins.

Consequence for the fix (and for A4): the consumer value must be emitted **on the
component's root element**.

### 3.5 Blast radius

One class, spanning:

- **`@reference-ui/icons`** — dead for any **novel** value: `color` *and every
  other style prop* (`bg`, `p`, `m`, …) via `{...rest}`, plus `css` and condition
  arms. Alive: `size` (inline style), `style`, `className`, native props,
  `variant`, `ref`.
- **`@reference-ui/lib`** — **all 26 `PrimitiveProps` passthrough parts**
  (Field, Switch/Thumb, Tooltip, Overlay/Content, Toast, Accordion, Slider,
  Menu, Popover/Close, …). `<Field bg="…">` faints identically.
- **Every `forwardRef` / aliased shell** (`Div as …`).

Not affected: same-compile consumption (package's own stories/book), non-style
channels (`className`, `style`, native props, events, `ref`), behaviour-only
components (Portal, FocusLock, Presence), and coincidental hits (values the
package itself compiled).

**Neither `jsxElements` nor `staticCss` can close it per-consumer** — both mint
into the *compiling* system's scope, which is the wrong scope by construction.

---

## 4. Approaches considered

From `reports/CONSULT.style-external.md`:

| # | Approach | Cost | Verdict |
|---|---|---|---|
| 1 | **Target-system wants** (compile into the component's system) | larger — needs a per-export component→system map (lib re-exports icons; a specifier-level map mis-attributes), new published metadata + import resolution | precision follow-up |
| 2 | **One namespace** (drop per-package prefixes) | requires republishing every frozen dist; cross-consumer collisions; breaks layer dedupe | rejected (closest to a re-architecture) |
| 3 | **Consumer re-mint / fan-out** (consumer emits the component's class string into its own sheet) | bounded, no metadata, re-export-proof | **recommended** |
| 4 | **Multi-system runtime / shared tables** | unifying runtimes doesn't create backing rules; needs JS token tables + injected sheets + CSP/SSR care | rejected as primary (strictly larger than #3) |
| 5 | **Component-side passthrough** (inline style / new API) | can't resolve consumer tokens; loses responsive/conditions; over-wins; edits every package incl. third-party | rejected |

---

## 5. Chosen approach — fan-out

### 5.1 Mechanism

1. **Extraction** stops dropping style props on **capitalized non-host JSX tags**
   (not css-threading wrappers): known style / condition / `css` / `r` props are
   extracted as **external** wants. Lowercase DOM tags keep their current path.
2. Each external want is **resolved with the consumer's `BaseSystem`** — so the
   token is resolved by **its owner** (the consumer).
3. The consumer compile **emits** the resulting deterministic class
   (`<system>__<stem>`) into **its own** utilities block — **one group per
   composed-system qualifier**, own-system group first (so output is
   byte-identical when there are no external wants).
4. The foreign runtime already mints the exact same string, so the consumer sheet
   now **backs it** → it paints; the miss probe finds the rule and stays silent.

### 5.2 Why it is safe / small

- **No runtime change** (the single-system `registerRuntimeData` replace stands).
- **No republication** of any frozen package (its CSS text and runtime are
  untouched).
- **No new published metadata** (no import resolution needed).
- Class strings are already **globally deterministic**, which is what makes the
  two sides meet.

### 5.3 Requirements satisfied

| Requirement | How |
|---|---|
| Named prop paints | consumer emits + backs `reference-icons__c_diagramRedText`; probe silent |
| Outermost element stylable | rest-forwarding roots (Field, IconShell) carry the class on the root; non-forwarding components need small per-component fixes (audit) |
| Override | JS prop-level defaults are replaced **before** minting (one class minted); recipe+utility pairs resolve utilities-over-recipes; cross-layer ties resolve own-last |
| Ergonomics | zero new API; public types already open (`StylePropValue<ColorToken \| (string & {})>`) |

### 5.4 Prior objections answered

1. **Token ownership** — resolved with the consumer system; only the class
   *string* is foreign-qualified; the rule lives in consumer-owned sheet bytes.
2. **Cross-consumer collision** — accepted (P4): impossible on single-consumer
   pages (the supported topology); multi-consumer already collides on `:root`.
3. **Namer parity** — holds by construction for normal props (stem tables are
   canon-global); edge = custom breakpoints/conditions/fonts.
4. **Sheet composition + gates** — foreign rules ride the own block under the
   consumer layer; the icons **count** gate is incompatible by design and retires
   into T17's structured accounting.

---

## 6. Change surface

**Rust** (`packages/reference-rs/modules/atomic/src`):

- `extract/jsx/mod.rs` — extract external wants on capitalized non-host tags.
- `atom/want.rs`, `runtime/builder.rs` (`AuthoredDeclaration`) — new
  `external: bool` (serde default false; backward compatible).
- `types.rs` (`CompileRequest`) + `assembly.rs` — accept upstream system names;
  partition external wants; resolve all with the consumer `BaseSystem`; insert
  atoms into per-qualifier `AtomSet`s (own first). (`Atom` is system-free —
  `decl.rs:14` — so no schema change.)
- `stylesheet/cascade/mod.rs`, `stylesheet/emitter/*` — own-system group +
  one appended group per foreign qualifier; plans per qualifier; the S4
  carried-keys proof-join must use per-target keys on both sides.

**TS** (`packages/reference-neo/src`):

- `sync/index.ts` + `native/contract.ts` (`ScopedCompileRequest`) — plumb upstream
  system names (extends/layers `baseSystem.name`, self last).
- No runtime, packager, or dist change.

**Components** (audit, not engine): components that do **not** forward `rest` to
their root need small forwarding fixes; includes the lib-internal icon call sites
(e.g. `packages/reference-lib/src/components/Icon/Icon.book.tsx:919`).

---

## 7. Effort, risk, edges

- **Effort:** moderate, **~3–5 days** (extraction + marker + partition + emission
  groups + input plumbing + gates + T17).
- **Risk:** medium-low. Sharp edges (named validation gaps):
  - S4 proof-join parity for per-target keys;
  - plan consumers that assume a single system;
  - harvest interplay for dynamic external values.
- **Accepted limits (first cut):**
  - **Responsive / conditional / font** external props may name differently across
    systems (stem tables are canon-global; breakpoints/conditions/fonts are not).
    Scope T17 to simple props; optionally refuse exotic external props with a
    diagnostic.
  - Cross-consumer collision on one page — accepted, not gated.

---

## 8. Test plan

**New `matrix/tests/chain/T17`** (T16 stays **frozen** as regression):

- Consumer defines a **novel** token and **proves it absent from every frozen
  sheet** (icons, lib, fixture dists) — so a pass can't be a coincidental hit.
- Passes it to a prebuilt icon via **direct import** and **lib re-export**.
- Styles a prebuilt **root** (`<Field padding="…">`).
- **Overrides** a package default.
- Asserts: computed **paint** on each; **override wins**; **zero
  `no compiled class`**; **every class backed**; and **structured icons
  accounting** (published count + consumer-added foreign count; no duplicates in
  either source).

Retire `publishedIconsRuleCount` exact-equality **in T17 only** (incompatible by
design with consumer-added foreign rules).

Per `PLAN.oracle` Venue-2: **no `reference-neo` twin** unless the harness can
consume a real prebuilt dist — otherwise it passes vacuously.

Optional (after this lands): a namer-level pin that a want compiled under system A
never backs a class minted under B.

---

## 9. Overall plan (arcs, sequencing, commits)

| Arc | Scope | Notes |
|---|---|---|
| **A — engine (fan-out)** | extraction → `external` marker → assembly partition → per-qualifier emission → TS plumbing | the core change; needs a focused `review: oracle` before implementation, then `ARC.review` |
| **B — root-forwarding audit** | components that don't forward `rest` to root; lib-internal icon call sites | small, per-component; depends on A for verification |
| **C — diagnostic (F2)** | `reference-neo` `css.ts` message: include constructed class + system; best-effort site | independent; own commit |
| **D — tests (T17)** | new matrix chain + accounting | lands with A; T16 frozen |
| **E — docs consumer** | A4 already landed (`className` workaround) | knock-on: revert to plain `color` prop once A lands |

**Sequencing:** A is the spine; C parallel; D after A; B after A; E's revert after
A. A's type/shape decisions get a focused Oracle review before code, and the
landed arc gets an Oracle `ARC.review` before commit.

**Commit hygiene:** engine commits separate and self-contained:
(1) engine fan-out (`reference-rs` + `reference-neo`); (2) diagnostic;
(3) T17 tests; (4) forwarding audit; (5) docs consumer / revert.

**Verification:** `test-core` (`pnpm agent …`) for matrix/`T17`; `agent-rs`
(`pnpm agentrs …`) for the extractor/assembly; `agent-neo` for sync plumbing;
`agentdocs` for the docs consumer.

---

## 10. Already landed

- **A4 (docs consumer fix)** — the six tone icons now colour correctly via
  `className={css({ color: … })}` on the icon (17 of 18 sites; the 18th is
  lib-source → Arc B). Docs gate green. This works around both the faint and the
  `ref-div` trap. It becomes **optional** once the engine fan-out lands.

Unrelated warning: the working tree also carries a **large pre-existing
uncommitted `@reference-ui/lib` component refactor** (not produced by this
mission) — keep mission commits isolated from it.

---

## 11. Open questions / follow-ups

1. **Target-system wants** (approach #1) as a precision follow-up — is it worth
   it once fan-out lands, or is fan-out sufficient?
2. **Exotic external props** (custom breakpoints/conditions/fonts) — refuse with
   a diagnostic, or attempt differential naming?
3. **`ui.config.ts:26`** ("must never cross" comment) goes stale — update it and
   record the new contract so it isn't re-litigated.
4. **`Dialog`** referenced in the brief is illustrative — lib has no such
   component; the root-forwarding audit defines the real set.

---

## 12. References

Mission: `.agents/missions/atomic-style-prop-backing/`

- `reports/CONSULT.oracle.md` — icon case is contract not defect; F1 (prop types),
  F2 (diagnostic), F3/F4.
- `reports/CONSULT.generalize.md` — one general class; blast radius; T16 blind.
- `reports/PLAN.oracle.md` — staged plan, corrections, BAN (now superseded).
- `reports/CONSULT.style-external.md` — feasibility, fan-out, change surface,
  T17, findings F1–F6.
- `briefs/*.md` — the exact questions put to Oracle.

---

## 13 · Task-level implementation plan (fan-out)

Full detail: `reports/PLAN.impl.oracle.md` (Oracle, read-only). Summary:

**Tasks** (one crew each; `depends_on` gates integration, not coding):

| # | Task | Pkg | Depends | Wave | Decisive proof |
|---|---|---|---|---|---|
| T01 | `external` marker across Want / AuthoredDeclaration / walks / sinks | rs | G0 | W1 | `agentrs c/v atomic`, zero golden drift |
| T02 | Extraction: external wants on capitalized non-host tags | rs | T01 | W2 | `agentrs c atomic`, snapshots unmodified |
| T03 | Assembly: qualifier list, want partition, per-qualifier plans | rs | T01 | W2 | `agentrs c/v atomic` (partition/plan pins) |
| T04 | Emission: own group + one appended group per foreign qualifier | rs | T03 | W2b | `agentrs c atomic` (byte-identity oracle) |
| T05 | S4 proof-join parity: per-target keys on both sides | rs | T03 | W2b | `agentrs c atomic` + consumer-audit note |
| T06 | TS plumbing: upstream system names into the native request | neo | none | W1 | SYNC-04 + no-upstream sync byte-diff |
| T07 | Diagnostic F2: message carries class + system, best-effort site | neo | none | W1 | `agentneo run` runtime/css |
| T08 | T17 matrix chain: the fan-out contract test (T16 frozen) | matrix | T01–06+G1 | W3 | `agent test --packages=@matrix/chain-t17` + t16 |
| T09 | Root-forwarding audit + lib-internal icon sites (+ comment draft) | lib | inv none; fixes G1 | W1+W3 | T17 + `agentct` |
| T10 | Docs consumer revert (A4 workaround → plain props) | docs | T08 | W4 | `agentdocs q` |
| T11 | NEO twin spike: genuine-upstream case or written drop verdict | neo | none | W1 | `agentneo run <case>` or drop verdict |

**Strategic gates (Oracle reviews the parts, not every task):**
- **G0** pre-implementation contract (before any T01–T06 code) → unlocks W1.
- **G1** post-engine review (goldens, SYNC-04, T16-green-untouched, S4 audit, T17 spec, T11 verdict, T09 inventory) → unlocks W3.
- **G2** pre-commit arc review (full diff + verification log + C1–C5 split) → unlocks commits.

**Waves:** W0 G0 · W1 T01·T06·T07·T09-inv·T11 · W2 T02·T03 · W2b T04·T05 · **G1** · W3 T08·T09-fix · W4 T10 · **G2** → commits.

**Commits (captain; crews never):** C1 engine (T01–T06 + T09 comment draft) · C2 diagnostic (T07) · C3 T17 (T08+T11) · C4 audit fixes (T09) · C5 docs revert (T10).

**Re-sync chain (captain, post-engine, pre-T08/T10):** rebuild Rust binding → `ref sync` icons then lib → **re-materialize both `react.mjs`** (mandatory after T07) → republish baseSystems → matrix `setup --sync` → test → docs `ref sync`.

**Decisions:** D1 **no flag** (default path byte-identical; rollback = revert C1) · D2 **document-first** exotic props (T17 = simple props; `is_simple_external_want` hook ready) · D3 T11 verdict recorded at G1 · D4 `ui.config.ts` prose ratified at G1 · D5 target-system wants deferred · D6 `atom_count` own+external, proof `css` map own-only.

## 14 · Captain log (living)

Objectives in order, per the owner:

1. Oracle authors the real implementation plan → `reports/PLAN.impl.oracle.md`.
2. Orchestrate line cooks (one crew per task/phase); captain verifies + commits.
3. Oracle reviews the **strategic parts** (named gates in §13, not per task).
4. This file is the planner and the log.

| # | Wave | Crew / artifact | State |
|---|---|---|---|
| W0 | plan | `CONSULT.style-external` → fan-out chosen | ✅ DONE |
| W0 | plan | `PLAN.impl.oracle` → task-level plan (T01–T11, G0/G1/G2) | ✅ DONE |
| W0 | gate | `G0.contract` → REVISE (C1–C22, all load-bearing) | ✅ DONE |
| W0 | gate | `G0.contract` REV 2 → re-review | ✅ DONE (REVISE: R1–R5) |
| W0 | gate | `G0.contract` REV 3 → re-review | ✅ DONE (ratified, crew-complete) |
| W1 | impl | crew **T01** marker schema (rs/atomic) | ✅ DONE (handoff T01.md; cargo green, zero golden drift) |
| W1 | impl | crew **T06** TS plumbing (neo/native+sync) | ✅ DONE (handoff T06.md) |
| W1 | impl | crew **T07** diagnostic (neo/runtime/css) | ✅ DONE (handoff T07.md) |
| W1 | audit | crew **T09-inventory** (lib, read-only) | ✅ DONE (handoff T09-inventory.md; 4 pinned parts) |
| W1 | spike | crew **T11** neo twin | ✅ DONE (handoff T11.md, recovered; NEO-CHAIN-08 landed RED) |
| W1 | fix | crew **T07b** re-pin react.mjs census `153457→153469` | ✅ DONE (handoff T07b.md) |

> **Health — CLEARED (pre-existing red, not ours).** `NEO-CSS-14` is **red on `public-release` HEAD**, independent of W1: isolation (all W1 src stashed + engine rebuilt from HEAD via `agentrs b`) reproduces the *identical* `sheet carries the harvested red floor` failure. T01's harvest diff is provably neutral at `external:false`; T06 is a no-op for the no-upstream world; T07 is runtime-only. Out of mission scope — must **not** block G1 (not in the decisive set).
>
> **Captain-verified firsthand:** `pnpm agentrs c atomic` green (**zero golden drift**); `pnpm agentrs v atomic` **314/314** (after the T07b re-pin); `NEO-CSS-16` PASS. Interference symptom (early W1 reads of `NEO-CSS-14`) explained and closed — see `handoffs/HEALTH-W1.md`.

| W2 | impl | crew **T02** extraction (rs/atomic) — **serialized** (see note) | ⚠️ BLOCKED→RULED (handoff T02.md; §D done, cargo 788 green; 11 true-external stations approved to update at T03) |

> **Captain ruling (T02 drift):** the 11 station fixtures are **approved true-external** drift (§D reverses their pinned silence, G0 C8). Update **want-level** assertions to the external expectation; leave `output/*` goldens + emitted-class assertions **unchanged** (final engine never emits external wants without upstream systems). Folded into **T03** so the crate greens in one step (C1 commits T01–T06 together). See `handoffs/T02.md` §6.

| W2 | impl | crew **T03** assembly partition (rs/atomic) — serialized | ✅ DONE (handoff T03.md; cargo 792, seam 314, q 0; 11 stations folded) |
| W2 | impl | crew **T04** emission grouping (rs/atomic) — serialized | ✅ DONE (handoff T04.md; cargo 796, seam 314, no drift) |
| W2 | impl | crew **T05** S4 proof-join (rs/atomic) — serialized | ✅ DONE (handoff T05.md; cargo 808, seam 314; **engine complete**) |
| G1 | gate | `G1.review` → **REVISE** (only C-T16 blocks; fail lines 2–5 PASS; F1/F2/F3 ratified) | ✅ DONE (report G1.review.md) |
| C-T16 | fix | composition rule (c): upstream own-only; sentinels + TS strip | ✅ DONE (handoff C-T16.md; **T16 native 6/6 + hermetic 6/6**; lib entry 0 icons) |
| G1b | gate | confirm C-T16 + ratify withheld `book/**` | ✅ DONE (ratified; W3 unlocked) |
| W3 | impl | crew **T08** T17 contract test (matrix) | ⚠️ BLOCKED→ruling (handoff T08.md; T17 built/correct; **2nd defect**: transitive qualifiers unplumbed) |
| W3 | fix | **G1c** ratify transitive `upstreamSystems` (C13 correction) | ✅ DONE (ratified; landing-proof list given) |
| W3 | fix | crew **C13-fix** land transitive qualifiers + full re-sync + hermetic gates | ✅ DONE (handoff C13-fix.md; **T17 14/14 + T16 6/6 native & hermetic**) |
| W4 | impl | crew **T10** docs consumer revert (A4 → plain `color`) | ✅ DONE (handoff T10.md; 17 sites; `reference-icons__c_diagram*` backing; 0 miss; docs gate clean) |
| G2 | gate | pre-commit arc review | ✅ DONE (REVISE → 5 file-assignment fixes applied) |
| — | commit | C1 `0c07ee60c` · C2 `57621cc88` · C4 `86f4487cf` · S1 `f5ca6e524` · S2 `ec7650d61` · C3 `4af0cbcbf` · C5 `1c253a28c` | ✅ **MISSION COMPLETE** |

> **COMPLETE.** Engine fan-out landed and verified (T16 6/6, T17 14/14 native + hermetic, cargo 808, seam 315/315); docs diagrams render on the plain `color` prop; infra slowness fixed (matrix ~20min → ~1–4min); NEO-CSS-14 fixed and guarded by `ATM-HARVEST-07`. Committed in the G2-ratified order; only the planner (`STYLE_PROP_EXTERNAL.md`) and `.agents/` remain untracked (excluded by design).
| W3 | impl | crew **T09-fixes** forwarding (Overlay Arrow/Handle) | ✅ DONE (handoff T09-fixes.md; default unchanged, override wins; CT 120/19/15 green) |
| SIDE | diag | `DIAG.neo-css14` → root-caused: **stale case**, engine per contract | ✅ DONE (orphaned by `5f9348cd6`; fix is case-side) |
| SIDE | infra | `PIPELINE.speed` — fast + bounded matrix runs | ✅ DONE (HANDOFF.md; **20min→1-4min**, staging **77GB→707MB**, +123GB) |
| SIDE | fix | T16 hermetic 5/6 → **real fan-out defect** (not infra) | ✅ root-caused (handoff T16-hermetic.md; native false-pass disproved) |
| SIDE | fix | NEO-CSS-14 case fix (token license + spec/README/ledger + seam station) | ✅ DONE (handoff NEO-CSS-14-fix.md; **PASS**; cargo 822/0, seam 315/315; ATM-HARVEST-07 landed) |

> **G1 FOCUS ITEMS (flags raised by T03 — Oracle must rule at G1):**
> 1. **Gauge reconciliation** (`tests/helpers.ts::namerIsInjective`): `atom_count = own+external` (D6) but proof `css` map own-only (C20) makes the old `distinct(css) === atomCount` identity impossible whenever an external want exists. Crew made it partition-aware (strict identity for external-free stations; emitted-class injectivity otherwise). Alternative reconciliations exist (e.g. a dedicated emitted-external count, or revisiting D6). Engine stands either way; only the gauge may need revising.
> 2. **Pooled dedup key** (`runtime/plan_pool.rs`): `first_seen` keyed `(external, own-key)`, skipping external with no foreign qualifier.
> 3. **Out-of-enumeration edits** (all inside `modules/atomic/**`): `native.rs` (crate won't compile without the field), `js/types.ts` (`Want.external?` TS mirror), the gauge.

> **Captain decision — serialize the engine waves (W2/W2b).** W1 proved concurrent same-crate crews cross-contaminate (a sibling's in-flight Rust edits surface as false reds in the other's decisive suite). T02/T03 (and T04/T05) both live in the `atomic` crate, so W2 runs **T02 → T03** and W2b **T04 → T05**, one crew at a time, each on a quiescent tree so its decisive suite is trustworthy.
