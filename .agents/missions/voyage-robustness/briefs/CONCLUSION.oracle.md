# Oracle design consult — bringing the change-set to a nice conclusion

STEP: CONCLUSION.oracle
PIN: HEAD `a1afefbb0` on `reference-system` (+ the filed-but-unfixed
`LIB_TASTY_RUNTIME_404`). Read the mission state:

- `.agents/missions/finalize/CLOSEOUT.md` (+ `PLAN-mdx.md`, `ARC3.md`)
- `.agents/missions/voyage-one-shot/CLOSEOUT.md`
- `.agents/missions/voyage-robustness/` — `GATES.md`, `MISSION.md`, `WAVE1..4.md`,
  and the reports (`DESIGN.oracle.md`, `PLAN.oracle.md`, `CWD.oracle.md`,
  `WAVE2.C2.arc.md`, `WAVE3.B3-depth.arc.md` as present)
- `docs/bugs/LIB_TASTY_RUNTIME_404.md`, `docs/bugs/NEO_EMIT_MODE_DRIFT.md`

## What has landed (for context)

1. **finalize** — closed (font-weight fix, MDX fragment exclusion, System docs).
2. **voyage-one-shot** — closed: one-shot `ref sync` ~15 s → ~300 ms (tasty
   memoization + the `@reference-ui/lib/baseSystem` zero-import subpath).
3. **voyage-robustness** (in progress) — C1 (documented builds unified on dist
   mode behind a freshness gate), C2 (emit determinism: `absWorkingDir` = neo
   package root ⇒ cwd-independent bytes; 6-line pin re-baseline), Wave 2.5
   (stale-neo holes), B3-depth (live-relative `react.mjs.map` sources; 3-line
   re-baseline), B4/B5/B6 (freshness directness, barrel-guard transitive walk,
   Windows marker). The `sync.lock` pin-walk exclusion. Oracle has LANDed each
   arc. In flight: `WAVE3.fix` (B3D P3/P4 follow-ups) and the WAVE4 arc review.
4. **Filed, unfixed:** `LIB_TASTY_RUNTIME_404` — the packaged lib lazy-imports
   an unmaterialized `./tasty/runtime.js`; also leaks esbuild's
   `__rewriteRelativeImportExtension` helper and makes every consumer bundler
   warn (Vite won't analyze a dynamic `import(<call>)`); lib rebuilds are
   non-atomic so a live docs dev server briefly 404s `dist/index.mjs`.
5. **Deferred:** native MDX (`PLAN-mdx.md`, Oracle-approved) — dispatched as a
   separate first-version mission.

## Ask

1. **The conclusion shape.** What is the minimal, honest closeout for
   `voyage-robustness` — which artifacts (CLOSEOUT.md contents, the residual /
   CUT ledger, the pin state, the "done" definition), and what must be evidenced
   vs merely asserted? Is the current wave set complete, or is a wave missing?
2. **The packaging seam.** Should `LIB_TASTY_RUNTIME_404` be fixed **now** as a
   final bounded arc (which of the three options — materialize the tasty runtime
   / make the import analyzable+non-leaking / relax the smoke — and its bar), or
   filed and deferred with the rest? Does fixing it belong to *this* body or a
   new one? Is there a **second** lazy edge / helper leak of the same class in
   the packaged lib or the reference-types output?
3. **"Satisfied" criteria.** Enumerate what must be true (gates, pins, suites,
   docs, filed bugs, dev-server cleanliness) before we can call this body of
   work *nicely concluded*. Flag anything that would make closing now
   premature or, conversely, anything we are gold-plating.
4. **Ordering.** Give the exact remaining order (waves, reviews, closeout) and
   what can run in parallel without colliding on the shared native tree.
5. **Risks of declaring done.** The known pre-existing reds (`bin/ref.test.ts`
   wording drift, flaky lock-kill repros, matrix mcp failures), the accepted
   content-class residual, the CUT list — what must the closeout say about each
   so nothing looks silently dropped?

## Constraints

One working tree (implementers serialize); a separate captain owns
`font-weight-runtime-1008` and a docs dev server is running — do not propose
touching those. No `reference-rs` contracts/engine-request changes.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
evidence, recommendation; a concrete closeout plan with the ordered remaining
steps and the "satisfied" checklist; P4 for non-repair observations.
