# PLAN.impl.oracle — execution-grade implementation plan for external style-prop fan-out

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line. Then author the
**real implementation plan** below. This is not a plan review — it is plan
**authoring**. A captain will run it and dispatch line-cook crews (sub-agents, one
per task/phase) to execute it. Do not edit product code; write only the report.

## The decision (fixed — do not re-litigate)

The owner has ruled: **it is one system.** A consumer must be able to style an
external/prebuilt component with style props — `<BoltIcon color="diagramRedText" />`,
`<Field padding="4r" />` (the outermost element), with the consumer value able to
**override** the package default. This supersedes `CONSULT.oracle` **F3**
("cross-system wants do not exist") and `PLAN.oracle`'s **BAN** recommendation.

`CONSULT.style-external` established feasibility and recommended the **fan-out**
approach. Author the plan for **fan-out**. F3/BAN are vacated — do not re-derive
them; if you believe a task is unsound, say so as a named risk, not by reverting
the decision.

## Ground truth (open the bodies; do not trust this summary)

- `reports/CONSULT.style-external.md` — the mechanism, recommended change surface,
  effort (~3–5 days, medium-low), four requirements, prior objections answered,
  T17 shape, findings **F1–F6** (F1/F2/F6 = implementation tasks; F4/F5 = accepted
  edges).
- `reports/CONSULT.generalize.md` — full blast radius (icons, 26 lib passthrough
  parts, forwardRef shells); why `jsxElements`/`staticCss` cannot close it.
- `reports/PLAN.oracle.md` — keep its **procedural** corrections even though its
  BAN polarity for lib is superseded: token-novelty must be proven, the
  value-kind split, positive controls, the rebuild/re-sync/re-materialize/republish
  steps a matrix run needs, in-repo call-site inventory, and verification mapping.
- `STYLE_PROP_EXTERNAL.md` (repo root) — the mission spec (the captain maintains it
  as the living planner/log).

## What to produce (all in the report file)

1. **Task graph.** Numbered tasks (`T01`, `T02`, …). Each task: **id · title ·
   package(s) · files (with line anchors) · inputs · concrete implementation steps ·
   acceptance criteria · verification command · depends_on · parallel group.** Make
   each task a **single crew's worth of work** — a crew must be able to execute it
   without re-deriving the design. Name the exact symbols/types to add or change.
2. **Strategic review gates.** The owner asked for **"Oracle reviews in strategic
   parts"** — so name the **few** high-leverage gates where the captain must stop
   for a focused `review: oracle` before the next wave, not a gate per task. For
   each: the artifact under review, the decision it unlocks, and the **fail line**.
   (Candidates to assess: extractor shape/marker schema; assembly partition +
   per-qualifier emission + the byte-identity invariant; the T17 assertion +
   novelty proof; the pre-commit arc review.)
3. **Wave / parallelism plan.** Which tasks run concurrently, the crew boundaries
   (one crew per task, or per phase), and the **handoff artifact** each crew leaves
   for the next. Captain → crew → nested workers is allowed.
4. **Verification matrix.** Per package: exact commands — `test-core` (`pnpm agent …`),
   `agent-rs` (`pnpm agentrs …`), `agent-neo` (`pnpm agentneo …`), `agentdocs`
   (`pnpm agentdocs …`) — and the **decisive suite** per task. State the re-sync /
   re-materialize / republish steps the matrix and docs need to see the change.
5. **Commit plan.** Commit boundaries (the user wants the engine fix kept separate
   from the docs/diagram work), **named files per commit**, and which crew output
   each commit contains. The captain commits; crews never do.
6. **Risk & rollback.** The sharp edges from `CONSULT.style-external` (S4
   proof-join parity for per-target keys; plan consumers that assume a single
   system; harvest interplay for dynamic external values). State plainly whether
   the default path (**no external wants**) stays **byte-identical**, and how each
   task preserves or proves that (it is the rollback guarantee if the change must
   be backed out).
7. **Decisions that need the owner or a gate** — list them explicitly; do not
   decide them silently. Include whether the fan-out ships behind any flag, and
   the exotic-external-prop limit from F4 (refuse-with-diagnostic vs document).

## Constraints

- **Read-only.** Do not edit product code, this brief, or `STYLE_PROP_EXTERNAL.md`.
- **Concrete over categorical.** File paths and symbols, not topic headings.
- Respect repo conventions: the `AGENTS.md` gate limits, commit hygiene, and the
  captain-commits rule.
- Keep the default path byte-identical; say how each task preserves that.
