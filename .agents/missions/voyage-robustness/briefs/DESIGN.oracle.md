# Oracle design consult — voyage-robustness content-class drift (DESIGN.oracle)

STEP: DESIGN.oracle
PIN: HEAD on `reference-system` (post `531544ea5`). Read
`.agents/missions/voyage-robustness/reports/PLAN.oracle.md` (the plan),
`.agents/missions/voyage-robustness/reports/WAVE0.recon.md` (the characterization),
and `docs/bugs/NEO_EMIT_MODE_DRIFT.md` (corrected).

## The fork

Your plan re-scoped T1 to four files and proposed **B2 = output normalization at
the `microbundle.ts` seam** (blank column-0 `// <path>` annotations,
line-preserving), with B3 for the map. But the Wave 0 recon (which you had not
seen; it landed after your pin) classified the four deltas:

| file | delta | class |
| --- | --- | --- |
| `system/baseSystem.mjs` | 7 esbuild `// path` banners + one reflowed destructuring | **banner-class** |
| `react/react.mjs` | different minified identifiers at the same call sites (8-line diff) | **content-class** |
| `react/react.mjs.map` | `sources`/`mappings` differ (stage/twin paths) | **content-class** |
| `types/types.mjs` | different **module graph** — `react/jsx-runtime` vs `react`/`createElement`; 2,202-line diff | **content-class** |

Each mode is byte-stable across runs. The pin is dist-mode; lib's documented
`sync` (`node ../reference-neo/bin/ref.ts sync`, source mode; runs in
`build`/`prepack`) cannot reproduce it (`verify-pins` FAILs 8).

So banner normalization makes **one** file cross-mode-identical, not four. The
content-class three are a transpiled-vs-source graph difference (tsc-emit
`dist/src` vs esbuild-on-`src`), not comments.

## Ask

1. **Confirm the classification** from the bodies the recon cites
   (`packager/react.ts`, `packager/reference-types.ts`, `neoFilePath`,
   `minify` settings, `build-bin.mjs` twin emit). Is `react.mjs` content-class
   (tsc-vs-esbuild emit), or could its delta be banner/format after all? The
   recon's 8-line minified-identifier diff argues content.
2. **Choose the strategy that can actually meet cross-mode byte-identity**, and
   name its entry points:
   - **(A) canonicalize resolution** across the four seams so both invocations
     build the *same* module graph — but you already rejected alias
     canonicalization as unsound (to-dist breaks fresh checkouts with no dist;
     to-source breaks packed installs). Does a *graph* canonicalization exist
     that is safe both ways (e.g. source mode resolving to the tsc-emit twin
     when present, else building it)?
   - **(B) output normalization** — shown insufficient for the three
     content-class files.
   - **(C) unify the workspace on the shipped dist mode** for every documented
     build path (`lib` `sync`/`build`/`prepack`, other packages' `sync`), so
     dev == ship == pin. What breaks (fresh clone, DX), and how is dist
     guaranteed before the sync?
   - **(D) bounded scope** — normalize the banner-class file + fix the map
     (B3) + make the documented scripts reproduce the dist pin, and *document*
     the content-class graph drift as an accepted, mode-scoped residual (since
     the shipped product is dist-only).
3. **Does B3 (map live-relative sources / F-A staged-commit orphan) fold into
   the same land** as the chosen B2 strategy? Confirm or split.
4. **Restate the revised backlog and bars** for B1…B6 + F-A/F-B/F-C/F-D under
   the chosen strategy, and the **first land**. If the answer is "content
   surgery," say exactly what surgery and its risk.

## Constraints

- Byte/semantic identity is the standing bar; the shipped artifact is dist mode.
- Fresh checkouts have no `dist` (in-repo scripts run source mode); a fix must
  not require a prebuilt dist to *run* dev.
- No `packages/reference-rs/contracts` or engine-request shape changes.
- One working tree; implementers serialize.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with file:line;
the strategy ruling with entry points and the identity bar it can meet; the
revised backlog/bars; the first land; P4 for non-repair observations.
