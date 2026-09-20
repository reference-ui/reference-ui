---
name: red-team
description: Adversarial QA loop — disjoint crews hunt one break per brief to a blind repro, then reproduce, rule, fortify, and chain-review the whole arc before anything commits.
---

# Red Team

Find real breaks, prove them, harden the system. One brief at a
time, one break per brief, every break pinned or deferred in
writing — never listed-and-left. Generalizes the doom-agent loop
beyond compiler hunting; for compiler briefs, pair with the
doom-agent skill's physics.

Activate when the user asks for red-team, adversarial QA, break-hunting,
or hardening cycles against any target.

## 1. The brief

Every hunt starts from a short written brief: the target module or
surface, the direction ("probe harvest sinks", "attack the alias
arm"), and the out-of-bounds list — what cannot be filed as a break
(the triage floor). The floor names what the target is correct to
refuse; everything else is fair game. Misdiagnosis is always in
bounds: the refusal must be right, not just present.

Schedule briefs so every top-level surface gets hunted over a run.
Thin log on a surface is itself signal — say so for scheduling.

## 2. The cycle (roles are disjoint)

The finder never reviews, reproduces, rules, fixes, or fortifies
its own find. Each stage is a separate crew:

1. **Break** — one hunter, one brief. Research is free (read code,
   trace flows, search the log). Pursue up to **3 theories**: name
   the gap, write the red test — if it passes, the theory dies
   spent; if it fails, that is the candidate break. Ships a
   **minimal repro runnable blind** (in `/tmp`, never in the tree,
   via the repo's own runners). No repro, no break. Three spent
   theories with nothing found is a clean hunt, reported as such.
2. **Reproduce** — a separate crew replays the repro independently.
   Unreproducible finds die here.
3. **Rule** — an architecture oracle adjudicates firsthand: genuine
   **BREAK** or working-as-designed **CURIO**, with severity
   honesty (user-facing vs. latent). A BREAK ruling draws the exact
   fortify boundary: what may change, what must move together, sweep
   obligations, what stays untouched, and the pins the fortify owes.
4. **Fortify** — an engineer crew closes the break inside the ruling
   boundary, with pins plus a regression station/case. No weakened
   tests; no blanket golden updates — every repin attested per pair;
   fail-without-fix / pass-with-fix proved firsthand. Pre-existing
   red is itemized separately, never absorbed.
5. **Chain review** — an oracle re-verifies the WHOLE arc firsthand:
   blind repro, new pins, full affected suites, line-by-line diff
   against the ruling boundary, contracts-held confirmation.
   Verdict: **VERIFIED** (commit-ready) or **GAPS** with
   file/line/expected/actual each.
6. **Commit** — only on VERIFIED, by the orchestrator (cf.
   star-captain), after firsthand suite re-runs. Then the cycle
   review: what broke, what held, what the next cycle probes.

## 3. Compounding memory

Every hunt ends as one atomic report in the agreed log dir: one
Hypothesis (gap pursued, red test written) and one Verdict
(clean-hunt or break-found with repro path and violated contract).
Consult the log before hunting — never spend a theory re-proving an
explored gap. Detail compounds: future hunters inherit your map.

## 4. Never interrupt a hunt

Observers monitor hunters **read-only**: log writes plus repro
artifacts. Never message or ping a hunting crew mid-theory for a
status update — working crews repeatedly exited when interrupted
for vitals (the ping-exit pattern: five dead crews in one voyage).
A hunter that stops to report is a hunter that stopped hunting.

Deadlock detection keeps its substance without interrogation: no
log writes, circling the same step, or waiting on itself means
stuck — intervene (interrupt, rebrief, replace) only on that
evidence. Talk to stuck crews, never to moving ones.

## 5. Satisfaction

A run sets a minimum cycle count before the done conversation, and
only HQ's explicit "satisfied" closes a standing loop. Clean hunts
with every real break fortified or architect-deferred earn the
discussion — the count informs the signal, never replaces it.
