# Crew brief — ARC3 — docs proof + dynamic-semantics bullet (font-weight-runtime-1008)

Crew lead on a captain mission. Implement **Arc 3 only**. Do **not** commit. Do
not kill or restart the user's running docs dev server. Append one progress entry
to `.agents/missions/font-weight-runtime-1008/LOG.md`. Report files changed +
exact commands + raw evidence.

## Context

Arc 1 (`977593fc6`) fixed the runtime resolver: `applyFamilyScope` in
`packages/reference-neo/src/runtime/css/scope.ts`, wired into `css.ts`. The fix
ships inside the generated docs bundle `.reference-ui/react/react.mjs`
(produced by the neo bin → packager), **not** in `styles.css` — the
`font-weight_200/_373/_393` rules already existed. So the docs bundle must be
rebuilt for the fix to take effect. Arc 2 (`69f0491d4`) pinned the runtime
against the static seam (NEO-NAMER-02 PASS).

## Tasks

1. **Rebuild the neo bin so `scope.ts` is in the shipped runtime.**
   From `packages/reference-docs`, the documented path is
   `node ../reference-neo/tools/ensure-dist.mjs` (it rebuilds `dist/bin/ref.js`
   only when src is newer). If the build fails on unrelated dirty files from a
   parallel session, stop and report — do not "fix" their files.
2. **Regenerate the docs bundle with a one-shot sync.**
   Run `ref sync` once from `packages/reference-docs` (via the repo's installed
   `ref` bin). The user's `sync --watch` holds the lock; the sync session
   **pokes** a live watch (SIGUSR2) — it does not kill it — so this is safe and
   the watch resumes. Do NOT `--break-lock` and do NOT kill any process.
   Confirm `packages/reference-docs/.reference-ui/react/react.mjs` is rewritten
   (mtime advances) and contains the scope pass (the minified six-keyword gate
   plus a `\p{L}\p{N}` family-key regex, or equivalent — verify by reading the
   regenerated bundle, not by grepping `styles.css`).
3. **Update the dynamic-semantics bullet (F2).** In
   `packages/reference-docs/src/content/docs/system/fonts.mdx`, the bullet
   "Dynamic values stay with keywords" is now wrong for the runtime: a
   variable-held string at runtime is indistinguishable from a literal and
   **is** scoped against the sibling family. Rewrite that bullet to state:
   runtime scoping applies to string values (literal or variable-held); the
   *static* authored-plan path keeps bare/keyword semantics; a dynamic value
   still needs its class to be sheet-backed (a `staticCss` entry or a
   coincidental static call site), else it is a miss. Keep the existing tone and
   the `sans.thin` disambiguation sentence if still true.
4. **Docs quality gate:** run `pnpm agentdocs q` and paste the result (must be 0
   errors).
5. **Evidence:** capture the synced bundle mtime and the `react.mjs` evidence
   from task 2 into your report; the captain will assert live computed styles.

## Constraints

- Do not touch unrelated files (parallel session owns `packages/reference-lib/**`
  packaging, `packages/reference-neo/src/packager/**`, `pipeline/**`).
- Do not commit. Report anything that blocks you plainly.
