# Oracle arc review — WAVE1.C1.arc

STEP: WAVE1.C1.arc
PIN: the C1 working tree (uncommitted) on `reference-system`. Read
`reports/WAVE1.C1.md` in full and `GATES.md` (this voyage's frozen bars).

## Arc

C1 (strategy (C) from your `DESIGN.oracle` ruling): unify documented build
paths on the shipped dist mode. Concretely: a new neo-owned dist freshness gate
(`packages/reference-neo/tools/ensure-dist.mjs`) + lib's documented scripts
(`sync`, `dev`) pointed at the dist CLI behind the gate, an audit of
docs/icons/root edges, and a residual paragraph in the drift doc. Goal: dev ==
ship == pin with **zero emitted-byte change** (empty pin diff).

## Captain verification (to be filled by the captain)

(To be completed at the pin: the zero-churn proof, the fresh-clone rebuild, the
steady-state gate time, and the suites.)

## Review

1. **Gate design.** `ensure-dist.mjs`: is the freshness predicate correct
   (mtime vs the right inputs; misses no dist-affecting source)? Does it fail
   loudly, honor the CI skip env, and stay ~nil steady-state? Any way it
   silently serves a stale dist?
2. **Script changes.** Do lib's `sync`/`dev` (and inherited `typecheck`/build)
   now run dist mode end to end? Any remaining source-mode invocation on a
   documented path (docs/icons/root)? Does the `dev` watch path still work?
3. **Fresh-clone proof.** Is "install → lib build rebuilds neo automatically"
   actually demonstrated, or only argued? Name the gap.
4. **Zero-churn claim.** Is the empty pin diff real and sufficient evidence, or
   could a byte change hide (e.g. `.reference-ui` regenerated but not gated)?
5. **Residual wording.** Is the drift-doc residual accurate and safe (source
   mode scoped to the neo inner loop; shipped bytes dist-only)?
6. **Anything that would let the new gate rot** — a dist built by a different
   tool, a symlink, a partial build, CI ordering.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line evidence, recommendation, validation gap; P4 for non-repair
observations. End with a verdict: LAND or HOLD, with the exact blocker if HOLD.
