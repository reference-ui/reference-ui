# Tones mission — living log

Tones: a colour at a named opacity (`bg="blue.500/medium"`), the second
concept beside shades. Owner-ratified shape; Oracle gate `PLAN.oracle`
(reports/) returned "findings (proceed)", all adopted.

## Decisions

- **Authoring.** `tokens({ tones: { medium: { surface: { value: '10%' }, line: { value: '34%' } } } })`.
  A flat leaf (`hush: { value: '6%' }`) serves every role. Values must be
  `<number>%` (light and dark); anything else is treated as an unknown tone
  (TONES-04). Lib's theme (`core/theme/tones.ts`) ships ghost 4/22, medium
  10/34, firm 14/46, strong 18/58 (surface/line).
- **Emit.** Custom properties: `color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
  Themeable, dark-overridable, scoped re-declarable (Oracle Q2).
- **Roles** (closed vocabulary, engine-keyed by canonical property):
  line = borders and border composites, outline, column/row/rule colours,
  text decoration and emphasis, stroke, caret, box/text shadow, `color`,
  `webkitTextFillColor`, and the webkit/moz mirrors of those; surface =
  everything else (background, fill, accent, flood, lighting, stop, gradient,
  scrollbar, tap highlight, msScrollbar*, fillImage/strokeImage, custom props).
  `boxShadow`/`textShadow`/`outline` composites are not canon colour props,
  so tones reach them only through braces (TONES-03).
- **Gate order** (TONES-05/01/06): whole-path hit → numeric → tone (base must
  be a `colors` entry, no leading `-`, not a CSS colour keyword) → today's
  behaviour. Lookup `tones.N.role` → `tones.N` → `tones.N.surface`.
- **Diagnostics.** Bare unknown tone: `ATM-W-UNKNOWN-TONE` warning, raw
  passthrough, did-you-mean over tone names. Braced unknown tone: existing
  `UnknownTokenReference` error with a tone-aware message, atom dropped
  (TONES-02).
- **Types.** `ToneToken` (first path segments), `TonedColorToken = \`${ColorToken}/${ToneToken}\``,
  added to colour props (open and strict); `Tokens.tones`.
- **External.** No new mechanism; T17 gains a consumer-local tone probe on a
  `color` (line role) prop (TONES-14).

## Slices

| id | scope | status |
| --- | --- | --- |
| S3 | typegen: tones category, ToneToken, TonedColorToken | landed `4248f3f74` |
| S2a | atomic resolution + ATM-W-UNKNOWN-TONE wiring | landed `def96d905` |
| S1 | lib tones tokens, generator, fixture regen/re-freeze | landed `153ee3a93` (pre-existing fixture drift) + `0d5892428` |
| S2b | ATM-TOKEN-19..23 stations + SPEC + NEO-DIAG-67 | landed `a3951a68f` (engine fix) + `5d358c828` + refine `eaaf4d0bb` |
| S4 | T17 consumer tone probe | in progress |
| S5 | docs: palette + colour pages (S5a), diagram migration (S5b) | in progress (before screenshots taken) |
| S6 | strict mode via ui.config: `strict?: ('colors'\|'radii'\|'spacing')[]` → typegen `emitDts({ strict })`, validation, Neo proof, D17 notes, docs "Enforcing tokens" | S6a typegen `2bc1faec2`+`3c730412f`; S6b Neo `5862760f8`; S6c case in progress; docs section pending |

## Log

- 2026-10-12 Oracle `PLAN.oracle` (muse-spark-1.3-contributor, max): findings,
  proceed. TONES-01/02/04/05/06 fixed in S2a; TONES-03/07 in the role map;
  TONES-08 pinned in base-system extends tests; TONES-09 in S3; TONES-11 in S1.
- `4248f3f74` typegen. Goldens move only by ToneToken/TonedColorToken, the
  `Tokens.tones` field and the colour value union. TYP-TONE-01..09.
- `def96d905` atomic resolution. Gate: numeric split first (byte-identical),
  whole key, tone, malformed warning, interpolation. Code `ATM-W-UNKNOWN-TONE`
  wired through codes/facts/policy/suggest, the shared diagnostics crate
  (`SUGGESTION_CODES` 9), `diagnostics/js/index.ts`, REGISTRY.md. Unit tests in
  `resolve/tokens/tones_tests.rs` and `tones_resolve_tests.rs`. Zero station
  golden drift. Known warning: `resolve/tokens/mod.rs` is 433 lines (371 at
  base), over the 365 soft limit.
- `153ee3a93` separate commit: lib.json had been stale since 58fb48635 (button
  tokens changed without regen; `base-system --check` failed on HEAD).
- `0d5892428` lib tones. Drift: ATM-SYS-01 (+8 `--tones-*`), harvest census
  bytes (+245 raw). Extends tests: role override keeps sibling, flat leaf
  replaces the group, dark override lowers.
- Stopped here on the coordinator's wrap-up order (no more opencode / Oracle).
- 2026-10-12 Resumed under the Claude-native workflow (Opus orchestrator, Haiku scouts/cooks). Added S6 strict mode. Type-cost baseline measured before S2b/re-sync.
- 2026-10-12 S6 scout: Neo owns typegen (`packager/types-bundle.ts:55`, `emitDtsSync({ baseSystem })` only; core retired b2c666a73). Fork: strict wraps only `SystemStyleObject`; JSX `StyleProps` stays open on purpose (`typegen/tests/strict.test.ts:4-6`), and lib components resolve lib's own `@reference-ui/react` in the monorepo. TGN-W-* only via unused `emitDtsDetailed`. Sent to oracle before cooking.
- 2026-10-12 Oracle verdict (S6): strict narrows JSX `StyleProps` too (typegen-only change; SPEC STRICT-01 already promises it); `validateConfig` throws on non-array/unknown categories (core's `validateStrict` precedent); Neo uses `emitDtsDetailed` and prints TGN-W-* as sync warnings; narrow `AssemblyInput.strict`; proof = typegen tsc tests + one Neo type case (not matrix). Lib component props are NOT promised to follow consumer strict. Open for architect: should lib peer-depend on `@reference-ui/react` so consumer types flow into lib props? Briefs: S6a typegen, S6b Neo plumbing (parallel), S6c Neo case (after both + native rebuild).
- 2026-10-13 Lib-reach facts: lib `.d.ts` import `@reference-ui/react` by bare name, undeclared; a synced registry consumer's own `node_modules/@reference-ui/react` link likely satisfies it (so consumer strict would reach lib props by accident); monorepo resolves lib's own. Claim stays consumer-authored code only. Separate packaging defect (9 shipped `.d.ts` reach unshipped `.reference-ui/` by relative path) spun off as its own task.
- 2026-10-13 S2b blocked on engine defect: whole braced unknown tone (`{colors.blue.500/mediun}`) took the bare tone path (warning, raw braces kept) instead of TONES-02 error+drop. Cook authorised to fix in a sibling file + unit test; ATM-TOKEN-19/20/22/23 and NEO-DIAG-67 green. Darwin-x64 addon rebuilt (`pnpm agentrs b`).
- 2026-10-13 `isolation: worktree` bases on origin/main, not public-release; S6a/S6b re-sent into manual worktrees `.claude/worktrees/s6a`, `s6b`.
- `a3951a68f` braced unknown tone (`{colors.blue.500/mediun}`, also `{brand/mediun}`) → ATM-E-UNKNOWN-TOKEN + drop; a declared tone gets no did-you-mean. `5d358c828` ATM-TOKEN-19..23, SPEC TOKEN 23/23, NEO-DIAG-67, quarantine entries for 21/22/23. Refiner `eaaf4d0bb`: merged braced path into `tone_value.rs` (one lookup, no double resolve; mod.rs 438→401), braced tests split to `braced_tone_tests.rs`; edge cases pinned (braced numeric, role split, `{brand/medium}`, mixed, padded braces fail closed). Known: composite `{brand/medium}` errors while whole resolves (pre-existing inconsistency).
- `2bc1faec2` typegen strict: open object prints as `BaseStyleProps`, `StyleProps = Strict…<BaseStyleProps>`, `SystemStyleObject = StyleProps & conditions`; `r` stays strict (no TS2456). Open goldens byte-identical. `3c730412f` renumbered probe to TYP-STRICT-07 (06 = absent-categories unit test).
- `5862760f8` Neo: `strict` on ReferenceUIConfig, validated (throws `Config field 'strict' is invalid.`), `AssemblyInput.strict` → `emitDtsDetailed`; all TGN warnings now join the sync report (second reportSyncDiagnostics). No types cache key (commit byte-compares). D17 docs updated; `parity/SPEC.md:68` label kept (pinned by census-union.ts:164). Stale strict/layers text remains in sync/SPEC.md:63, parity/SPEC.md:56, core-api-parity.md:39, type/SPEC.md:31, layer/SPEC.md:53, chain/SPEC.md:40-46.
- Re-sync: native addon + neo dist rebuilt; dev:lib restarted (owner-approved); lib `baseSystem` ships tones, `ToneToken = 'firm'|'ghost'|'medium'|'strong'`, lib styled types 86608 B. Lib sync now surfaces pre-existing `TGN-W-UNKNOWN-TOKEN-CATEGORY` (21 `animations` tokens have no printed union).
- Full `pnpm agentneo run`: 12/287 failed (MERGE-06, SITE-06/23/26/27, STATIC-01/02/03, NAMER-03/04, REF-04/11); baseline triage in progress.

## Verified at `5862760f8` (orchestrator re-ran)

- `pnpm agentrs c atomic` pass; `pnpm agentrs v atomic` 320/320
- `pnpm agentrs c typegen` pass; `pnpm agentrs v typegen` 54/54 (after `pnpm agentrs b`)
- `pnpm agentrs q` 0 violations
- neo vitest `src/config src/packager` 57/57; `repro.test.ts` 62/62
- `pnpm agentneo run` NEO-TYPE-01/02/07/08, NEO-DIAG-63/64/67, NEO-PARITY-02 all PASS

## Verified at `0d5892428`

- `pnpm agentrs c atomic` 826 lib unit tests (+14 integration) passed
- `pnpm agentrs v atomic` 315 passed, no unintended golden drift
- `pnpm agentrs c typegen` 73 passed; `pnpm agentrs v typegen` 51 passed
- `pnpm agentrs c base_system` 85 passed; `base-system --check` current
- `pnpm agentrs c --crate diagnostics` 37 passed
- `pnpm agentrs q` 0 code violations (109 warnings repo-wide)

## Type-cost baseline (2026-10-12, pre-tones generated types)

Generated `styled/types/index.d.ts` (no tone types yet; native addon
`dist/native/reference-native.darwin-x64.node` dated Oct 10 predates the emitter,
so re-sync needs a native rebuild first):

| file | bytes | lines | ColorToken members |
| --- | --- | --- | --- |
| lib `.reference-ui/styled/types/index.d.ts` | 84716 | 1457 | 320 |
| lib `dist/runtime/reference-ui/styled/types/index.d.ts` | 84529 | 1457 | 313 (stale vs generated) |
| docs `.reference-ui/styled/types/index.d.ts` | 85196 | 1457 | 345 |

Docs `pnpm --filter @reference-ui/reference-docs exec tsc --noEmit`: real 0.95/0.80/0.89 s
(median 0.89, ~0.4 s is pnpm wrapper). `--extendedDiagnostics`: Types 80541,
Instantiations 359143, Memory 280344K, Check 0.250 s. TS 7.0.2, cold (no tsbuildinfo).

## Next steps (in order)

1. **S2b** — run `briefs/S2b.stations.md` as written: stations ATM-TOKEN-19..23
   (happy path + role map, numeric unchanged, unknown-tone diagnostics bare and
   braced, custom tones via `baseSystem.json` incl. flat/surface-only/dark/
   fraction, never-tone paths), SPEC.md entries, Neo repro row + NEO-DIAG-67.
2. **Neo/lib re-sync** — `ref sync` lib so `@reference-ui/lib/baseSystem` ships
   tones; check `pnpm agentneo run` diag cases.
3. **S4** — T17: consumer-local tone `t17ProbeTone` in `matrix/tests/chain/T17/src/tokens.ts`,
   a `color="t17ProbeInk/t17ProbeTone"` probe on a prebuilt icon; extend the
   novelty gate and the exact-set icons accounting (TONES-14); rule must
   reference `--tones-t17-probe-tone-line` or the flat var. Full re-sync chain
   in `matrix/tests/chain/T17/ui.config.ts`, then `pnpm agent test --packages=@matrix/chain-t17`
   and T16.
4. **S5 docs** — Palette page (ramps grouped neutrals vs hues, "in use"
   snippet) and Color page (shades vs tones; roles; tones at four strengths;
   composition showcase; role-not-just-strength; complementary accents; four
   relationships), all using `/medium` syntax. Migrate `DiagramPanel.tsx`,
   trays/chips/meters in `content/diagrams/specimen-*`, and
   `content/docs/components/color-composition.tsx` to tones; delete the
   literals; update diagram `DESIGN.md` (tones now core; transparent base
   resolves open question 1; srgb vs oklab note). Visual change, not a
   refactor (TONES-10): compare with before screenshots in
   `.screenshots/localhost-5174/{diagram,colors}/before-*` (kept 7 days),
   light and dark, zero console errors; `pnpm agentdocs q`.
5. Measure type cost: `.d.ts` bytes and docs-app `tsc --noEmit` time before/after
   (Oracle estimate ~1.2k template members).
6. Later: add toned values to the NEO-NAMER-01 corpus when it lands (TONES-12).
