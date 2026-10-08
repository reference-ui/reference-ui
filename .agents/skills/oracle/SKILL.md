---
name: oracle
description: Consult the Muse Spark 1.3 Contributor-tier model at Max effort via the Muse CLI. It reviews a plan or objective, reviews each landed arc, reviews the changes the plan flags, and answers design consults. Read-only. The `oracle` agent carries the CLI call as the captain's context firewall.
---

# Oracle

The Oracle is Muse Spark: a fast, high-judgment reviewer the captain calls at
planned points (see `captain`). It is a consulting expert, never the foreman and
never a token burner: it does not implement, run tests it could delegate,
supervise crews, manage queues, or gate routine work.

Muse Spark is not an OpenChamber model. The **`oracle` agent** — a DeepSeek V4.1
Flash sub-agent, defined in `.opencode/agents/oracle.md` — carries the CLI call.
It is a **context firewall**: the Oracle's transcript is large and off-task, so
it never enters the captain's context; only the one-line status does. The captain
does not call `muse exec`. This skill is the captain's: what to ask, and the
exact command to hand the carrier.

## Provider constraint (hard, owner-ordered)

Every Oracle call in this repo uses **model ID `muse-spark-1.3-contributor` at
reasoning effort `max`**. Reference UI is open source (MIT), so the Contributor
tier — the variant that trades price for training permission — is the right one
here. That is the deliberate difference from a closed-source tree, which would
use the Standard ID so its prompts are never trained on. Never call the Standard
`muse-spark-1.3` in this repo.

Before the first call of a session, confirm the CLI resolves the model:

```sh
muse model-profile show muse-spark-1.3-contributor --effort max
```

The output must name exactly `muse-spark-1.3-contributor`. If it fails or names
anything else, do not call Muse. Record the profile output and the exact
invocation in the step's attestation file,
`.agents/missions/<id>/reports/<step-id>.attest.md`. Session metadata, when
available, is the evidence for the model that ran; do not claim runtime metadata
confirms effort if the CLI does not expose it.

## What to ask, and when

Three review points, plus consults. Each brief is a durable file under the
mission (`.agents/missions/<id>/briefs/<step-id>.md`, never `/tmp`) that states
the question, gives the Oracle everything it needs, and asks for `STATUS: DONE`
(or `STATUS: REFUSED`) as its first line. Step IDs: `PLAN.oracle`,
`ARC1.review`, `T1.oracle`.

1. **Plan / objective review (before work starts).** Brief: the objective's
   intent, constraints, the relevant code and contracts, and the proposed
   decomposition into arcs and unit tasks. Ask it to review the shape: what can
   run in parallel and what must be sequenced (with `files` and `depends_on`),
   which interfaces should be reviewed before others build on them, and which
   tasks deserve their own Oracle review and why. Not only high-risk ones.
2. **Arc review (after each arc, and a mission has many).** Pin the exact
   commit. Brief: the arc's intent, contracts, changed files, prior
   verification, and how it connects to neighbouring arcs. Ask for architecture
   and system fit, hidden assumptions, robustness and test adequacy, and above
   all the seams with the other arcs.
3. **Focused change review (changes the plan marks `review: oracle`).** Pin the
   change's commit and ask for a focused correctness and risk review.
4. **Consults.** One question, the evidence, and the options already considered.
   Muse returns a recommendation with reasoning, task-sized briefs that could
   implement it, and a short decision record, which the captain files in the
   ledger. Only work that depends on the answer pauses.

## Invocation (headless, read-only)

This is the exact command the captain hands the `oracle` agent:

```sh
muse exec --model muse-spark-1.3-contributor --reasoning-effort max \
  --prompt-file .agents/missions/<id>/briefs/<step-id>.md \
  --workspace /Users/ryn/Developer/reference-ui \
  --trust-workspace \
  --approval-mode never \
  > .agents/missions/<id>/reports/<step-id>.md
```

- `--trust-workspace`: without it the session skips project rules and skills as
  untrusted. `--approval-mode never`: a headless run must not stall on a prompt.
  Keep the sandbox on: no `--yolo`. Muse writes no workspace files.
- The redirect saves the Oracle's final response unchanged as the step's report;
  the attestation goes in the separate `.attest.md` file beside it.
- A headless shell has no interactive `muse` zsh function (which unsets
  `META_API_KEY` before calling `~/.local/bin/muse`). If the ambient key shadows
  the stored credential, call the binary the same way:
  `env -u META_API_KEY ~/.local/bin/muse exec ...`.

## Oracle conduct

Open every implementation and test body you cite before concluding; search
output only locates candidates. Argue from the code, not from the author's
summary, and attempt concrete counterexamples (stale writes, races, dropped
declarations, stale caches, cross-package leaks). Keep only claims that survive.
Name validation gaps explicitly instead of assuming coverage. Judge a pinned
commit as frozen. Never edit product code, dispatch work, or launch operations:
the review file is the entire response. A missing test is a task
recommendation. Do not send the user a choice between proving the objective and
narrowing it. The captain schedules the proof.

## Finding format

Each actionable finding carries a stable ID and: severity, file and line at the
pinned commit, evidence (exact code or tests), recommendation, and the
validation gap. Recommendations describe observable behavior, not line-diff
patches. Observations that are not repair orders (accepted patterns, deferred
risks) are marked P4 so they do not enter the fix queue. End with a verdict
(clear, findings, or refuse), and whether the reviewed slice can merge while the
gaps become the next tasks. Do not ask the owner to choose. The objective is the
direction.

## Staleness

Findings are advisory at HEAD. A fresh reviewer rules each one still valid,
partially valid, or obsolete before any change (see `red-team`); the captain
only relays.
