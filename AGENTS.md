# Reference UI Agent Guidelines

Repository-wide conventions, dev server policies, and visual verification instructions for all AI agents.

---

## Skills vs `test-core`

`view-story`, `test-component` and `ux-designer` are **skills** (component workflows for `@reference-ui/lib`).

**`test-core` is not a skill.** It is the pipeline runner (`pnpm agent`) for the kept matrix suites (`matrix/*`) and the pipeline. `packages/reference-core` was retired in `b2c666a73`; its work now lives in Neo and reference-rs (see the table). Docs live at `.agents/skills/test-core/SKILL.md` so agents can find the CLI — treat it as infrastructure, not a loop to work through.

| You changed | Use |
| --- | --- |
| `@reference-ui/lib` look/feel | `view-story` skill |
| `@reference-ui/lib` component logic / CT / snapshots | `test-component` skill (`pnpm agentct`) |
| `@reference-ui/lib` component UX sign-off (look, feel, accessibility) | `ux-designer` skill (judge with `view-story`) |
| `packages/reference-rs` (Rust crates, N-API, system compiler) | `agent-rs` skill (`pnpm agentrs`) |
| packages/reference-neo (TypeScript above the cut: fragments, publish, runtime) | agent-neo skill (pnpm agentneo) |
| `packages/reference-docs` (docs app: MDX content, shell, examples) | **agent-docs** skill (`pnpm agentdocs`) |
| `matrix/*` (kept chain and MCP suites), `packages/reference-mcp`, `pipeline/*`, hermetic bundler contracts | **test-core** (`pnpm agent`) |
| Neo sync perf / memory / bundle size at scale | `benchmark` skill (`pnpm bench:neo`) |
| Serial `sync()` speed in `packages/reference-rs` (diets, alloc kills, lookup restructure) | `agent-perf` skill: the perf index and its tools (Memex `perf` collection) |
| Past hunts, verdicts, cases, evidence (agent memory) | Memex (`node .agents/memex/cli.mjs`, `.agents/memex/README.md`) |

If a lib-component task also modified `matrix/*`, `pipeline/*` or `packages/reference-mcp`, finish `test-component` for the component, then **switch to test-core** for that proof. `pnpm agentct` does not cover them. Neo and reference-rs changes go to `agent-neo` / `agent-rs` (table above).

---

## 0. Component Seeing Contract (`view-story`)

Whenever an agent needs to SEE a component in `@reference-ui/lib`:
- **Activate the `view-story` skill** (`.agents/skills/view-story/SKILL.md`).
- Standard eyes are the built-in browser against Book.
- Embed screenshots directly in chat. Seeing is not verifying — proof
  belongs to `test-component` (`pnpm agentct`).

When a user prompt asks to fix, polish, style, improve, or adjust a
component: view it first (`view-story`), implement in
`packages/reference-lib/src/components/<Component>/`, prove with
`test-component` (`pnpm agentct`). If `matrix/*` or `pipeline/*` was also
modified, switch to **test-core** (`pnpm agent`) for matrix proof.

---

## 1. Dev Server & Local Environment Policy

> [!IMPORTANT]
> Agents MAY run `pnpm dev:lib` themselves. Single instance only: check port
> 5000 first (`curl -s -o /dev/null -w '%{http_code}' localhost:5000`); if it is
> already up, use it instead of starting a second. Prefer the managed background
> session so logs stay inspectable, and stop only processes you started.

---

## 2. Visual Inspection & Screenshots

> [!CAUTION]
> **NEVER write hand-rolled browser scripts or one-liners** such as:
> `node -e "const { chromium } = require('playwright'); ..."`
> Use the built-in browser; bespoke capture clients are retired.

### Standard viewing moves

1. Ensure the target server is up — Book `:5000` (`view-story`), docs
   `:5174`, playground `:5199` (`pnpm playground`). Single instance
   each; if one is already up, use it instead of starting a second.
2. `navigate` to the story / route / page.
3. `read_page` or `get_page_text` for refs and text, `computer`
   screenshot for pixels.
4. `javascript_tool` for computed CSS and boxes; `computer` click /
   type / key / hover to interact; screenshot again.
5. `read_console_messages` before trusting pixels — a throwing page
   renders a lie.

Built-in browser screenshots come back inline; **always embed them directly
into your response**. When a screenshot must be kept as a file, save it under
the repository-root `.screenshots/`: the one gitignored place for agent
snapshots, never nested inside a package. Kept files are temporary.

Browser tools are for design work and playtests. A failing Playwright test is
debugged from its own artifacts instead: failure screenshots, `frames.png`
stills beside each video where the runner makes them, and the trace, read as
text with `npx playwright trace open <trace.zip>` then `errors` / `actions` /
`console` / `screenshot <action-id> -o <png>`.

---

## 3. Matrix Verification (`test-core`, `pnpm agent`)

`test-core` is the pipeline runner, **not a skill**. Follow `.agents/skills/test-core/SKILL.md` whenever you change `matrix/*`, `pipeline/*` or `packages/reference-mcp`, or need hermetic matrix proof. Do not use `test-component` / `pnpm agentct` for matrix work.

```bash
# 0. Check runner & daemon status:
pnpm agent status

# 1. Fast native Playwright for one kept matrix suite (runs unthrottled PRI 46, with port 4173 cleanup, queue locks, and exit pass signals):
pnpm agent pw chain/T8                 # matrix/tests/chain/T8

# Native Vitest (unit tests):
pnpm agent vt packages/reference-mcp   # MCP server unit tests
pnpm agent vt packages/reference-lib/src/components/Accordion/Accordion.test.tsx

# 2. Full component verification in one shot (typecheck -> unit -> lib build -> component CT E2E; final check before completion):
pnpm agent verify <ComponentName>
# e.g.: pnpm agent verify Toast

# 3. Hermetic Matrix Verification (Unthrottled Dagger Runner across bundlers & React runtimes):
pnpm agent test --packages=@matrix/<package>
# or canonical fallback:
pnpm pipeline test --packages=@matrix/<package>
```

> [!IMPORTANT]
> **Testing Policy (`test-core`)**:
> - **Never execute raw Playwright or Vitest commands directly in subshells** (e.g. `pnpm --dir matrix/... exec playwright test`). Raw subshell commands run under clamped Darwin QoS (`PRI 31`), orphan Vite processes on port 4173, and lack clean exit pass signaling on SIGINT.
> - **Always use `pnpm agent playwright` / `pnpm agent vitest`** for fast native iteration.
> - **Use `pnpm agent test --packages=@matrix/<package>`** when you need full, hermetic multi-runtime/bundler matrix validation in Dagger containers.
> - After a `matrix/*` or `pipeline/*` change, this section is the proof path — not `pnpm agentct`.

---

## 4. Reference RS Workflow (`agent-rs`, `pnpm agentrs`)

Follow `.agents/skills/agent-rs/SKILL.md` whenever you work in `packages/reference-rs`.

### The Core Commands
```bash
# Per-module seam verification (Vitest against N-API / TS wrappers):
pnpm agentrs v                                               # all module vitest suites
pnpm agentrs v atomic                                        # ONLY atomic tests (never runs tasty setup)
pnpm agentrs v tasty                                         # ONLY tasty tests
pnpm agentrs v atlas                                         # ONLY atlas tests
pnpm agentrs v styletrace                                    # ONLY styletrace tests
pnpm agentrs v atomic --update-goldens                       # updates atomic golden snapshots (CLI only, never env var)
pnpm agentrs v <test-path>                                   # target single file

# Fast domain Rust verification (cargo test):
pnpm agentrs c                                               # all workspace tests
pnpm agentrs c atomic                                        # auto-detects crate (-p atomic)
pnpm agentrs c tasty                                         # -p tasty
pnpm agentrs c atlas                                         # -p atlas
pnpm agentrs c styletrace                                    # -p styletrace
pnpm agentrs c <crate> -t "<pattern>"                        # crate + test filter

# Code quality & comment check (MANDATORY after every generation):
pnpm agentrs q                                               # smart check (changed files / system)
pnpm agentrs q <file-or-dir>                                 # target specific file or directory
pnpm agentrs <path-to-file>                                  # path shorthand runs quality automatically

# Full verification:
pnpm agentrs t                                               # runs build -> cargo -> vitest -> quality
pnpm agentrs                                                 # bare command runs full dev loop
```

> [!IMPORTANT]
> **Code Quality & Comment Standards for `reference-rs`**:
> This is a compiler, not a toy. Write small enough to analyze, fail explicitly (`Result`/diagnostics, not `unwrap`), put pass state in a type, and never silence the analyzer. The numbered limits below are the checks; that is the taste.
> 1. **Zero tolerance default**: any code violation causes immediate failure (exit 1). Not an optional check.
> 2. **File length**: Hard failure if a file exceeds **500 lines**; warning at **365 lines** (*"Can you split this up, please?"*).
> 3. **Cyclomatic complexity**: Keep $\le 10$ (failure $> 15$). Cognitive complexity $\le 15$ (failure $> 20$).
> 4. **Function length**: Keep $\le 80$ lines (failure $> 120$).
> 5. **Function arguments**: Warning at $> 4$, failure at $> 5$. Introduce a context/session struct (e.g. `ExpressionWalk`, `ObjectWalk`, `ExtractContext`). **Never** `#[allow(clippy::too_many_arguments)]`.
> 6. **Clippy allows & cheating are strictly banned**: `#[allow(clippy::…)]` / `#[expect(clippy::…)]` fail the quality gate immediately. Do NOT attempt syntactic workarounds or parameter soup tuples. Fix the architecture.
> 7. **Top-of-file commentary**: 2–6 sentences at the top (`//!` / `/**`) describing what the file does, takes, and emits. Tiny types can be 2 sentences; a walker or lowering pass can be 4–6. No lazy one-liners, not an essay.
> 8. **Inline comments stay terse**: Explain *why*, not *what*. The file header is the paragraph; function bodies are not.
> 9. **README rule**: Module-level `README.md` must describe overall architecture, never directory tables of filenames.
> 10. **Queue & Concurrency**: Concurrent runs coordinate via `/tmp/reference-ui-cpu-gate`. Do not bypass `pnpm agentrs`.

---

## 5. Neo Runtime Workflow (agent-neo, pnpm agentneo)

Follow `.agents/skills/agent-neo/SKILL.md` whenever you work in `packages/reference-neo`.

Neo is the code word for the runtime portion of reference-rs — TypeScript above the cut (fragments, publish, runtime), Rust below. Neo is not a fork of core and never touches lib; its loop is cases plus Playwright in `packages/reference-neo/tests`, with no matrix and no Dagger in the inner loop.

```bash
pnpm agentneo list            # all cases: id, name, folder, README first line
pnpm agentneo search <query>  # find cases by id, name, or README text
pnpm agentneo run [case-id]   # run one case, or all cases when omitted
pnpm agentneo q [paths]       # Biome quality gate (section 6 of the skill)
```

See the skill for Playwright policy, scope discipline, gate limits, and the retirement clause.

---

## 6. Docs Workflow (agent-docs, pnpm agentdocs)

Follow `.agents/skills/agent-docs/SKILL.md` whenever you work in `packages/reference-docs`.

The docs app is a thin Vite + React + TanStack Router shell around MDX. Reference UI compiles CSS at build time, so there is **no client-side code playground** — examples render the real components and show static, build-time-highlighted source.

```bash
pnpm dev:docs                 # serve :5174
pnpm agentdocs q [paths]      # docs quality gate (Biome + strict tsc + suppressions)
```

The gate's fail line is cognitive complexity 20, `any` banned, file length 500, and every `tsc --noEmit` error; warnings (12 / 365) shout but do not block. Suppressions (`biome-ignore`, `@ts-ignore`, bare `@ts-expect-error`) fail immediately — fix the code. After the gate is green, do the reading pass: naming, no panda-isms, and nothing too complicated or weird-looking.

---

## 7. Test Case Convention

Every case-driven suite uses one shape, for Neo, reference-rs and any new module.
A case is a folder named by its raw ID (`ATM-TOKEN-06`, `NEO-TYPE-09`) that holds:

- `case.json`: the index entry, `{"id": "ATM-TOKEN-06", "name": "<one-line claim>"}`.
- `README.md`: first line `# <ID> — <one-line claim>`, the claim the same text as `case.json`'s `name`.
- The runnable part and its inputs and outputs. reference-rs: `spec.ts` (`{ id, verify }`), `input/`, `output/`. Neo: `specs/` and `world/`.

The reference-rs runner (`packages/reference-rs/testing`) fails any folder under `cases/` that is not named by a raw ID, and any case whose `case.json` is missing or whose id differs from its folder name, or whose README first line is not that heading. Neo's runner enforces the same rules in `packages/reference-neo/tests/shared/caseIndex.ts`, and also requires case.json `name` to equal the README claim: `listCases()` runs that check, so `pnpm agentneo list`, `search` and `run` all fail on a broken case folder. Memex indexes `case.json`: Neo cases in `cases`, reference-rs cases in `rs-cases`.


