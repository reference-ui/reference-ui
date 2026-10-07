# Brief — WAVE0.recon (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 0 of the robustness voyage: reproduce the candidate gaps with evidence and
survey for others. **Recon only — no product code changes.** Read
`.agents/missions/voyage-robustness/MISSION.md` and
`docs/bugs/NEO_EMIT_MODE_DRIFT.md` first.

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do not
commit, push, or `git stash`. Do not touch `packages/reference-rs/**` or the
pre-existing untracked `pipeline/` files. Disclose any file you did not touch.

## Reproduce (with evidence, no product change)

1. **T1 — emit-mode drift.** Emit the docs `system/baseSystem.mjs` under two
   invocation modes and diff them:
   - **source mode:** a lib/docs sync that runs neo from source
     (`packages/reference-lib/package.json` `sync` → `node ../reference-neo/bin/ref.ts sync`),
   - **dist mode:** the voyage harness
     (`node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs sync packages/reference-docs`).
   Capture both payloads (save copies under the mission `reports/` dir or
   `/tmp`, not committed), and report: the byte diff size, the exact differing
   lines (expected: `// …src/…` vs `// …dist/src/…` banners), and a
   semantic-equality check (fragment normalized-equal; `streams`, `jsxElements`,
   manifest, CSS identical). Confirm whether the drift is **only** banner
   comments or whether anything else moves.
2. **T2 — silent stale upstream.** With lib's `.reference-ui/system/baseSystem.mjs`
   present, determine from the code path (`config/load.ts`, `evaluate.ts`, the
   `./baseSystem` export) whether a stale payload is detected at all. If
   feasible non-destructively (e.g. copy the file aside, alter it, observe, then
   restore byte-for-byte — never `git stash`), demonstrate that docs config load
   serves the altered payload with no warning. If a live demo is too invasive,
   give the file:line proof that no mtime/hash check exists.
3. **T3 — proof-harness gaps.** Confirm `verify-pins.mjs` passes with no
   preceding fresh sync (vacuous PASS) by reasoning from its code (do **not**
   corrupt pins); and note the missing dist-provenance attestation.

## Survey (T4)

Walk the config-load / emit / exports / guard surfaces and list any other
robustness gap with file:line and a one-line observable failure it would cause:
`config/load.ts`, `config/bundle.ts`, `config/evaluate.ts`, `config/errors.ts`,
`lib/microbundle/**`, `collect/lib/bootstrap.ts`,
`packages/reference-lib/package.json` exports, the barrel guard, and the packed-
tarball smoke. Do not invent; cite.

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE0.recon.md` with the T1
diff evidence, T2 finding, T3 confirmation, and the T4 candidate list. Append a
WAVE0 entry to `.agents/missions/voyage-robustness/WAVE0.md` and reply with a
short summary.