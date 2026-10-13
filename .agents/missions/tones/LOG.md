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
| S4 | T17 consumer tone probe | landed `e9fdbd345` (+ pipeline cache key `f5a71818c`) |
| S5 | docs: palette + colour pages (S5a), diagram migration (S5b) | landed `179ac9b57` + refine `986e8a887`; `38eb97825` + contrast `7a052fd11` |
| S6 | strict mode via ui.config: `strict?: ('colors'\|'radii'\|'spacing')[]` → typegen `emitDts({ strict })`, validation, Neo proof, D17 notes, docs "Enforcing tokens" | S6a typegen `2bc1faec2`+`3c730412f`; S6b Neo `5862760f8`; S6c `c2a6ad052` NEO-TYPE-09; docs section in S5a |

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
- Full `pnpm agentneo run`: 12/287 failed (MERGE-06, SITE-06/23/26/27, STATIC-01/02/03, NAMER-03/04, REF-04/11); baseline triage: all 12 pre-existing (identical at a57b92a4e). 10 from 5f9348cd6 (colour-harvest allowlist; specs still expect hex floors), REF-04/11 from 0e08d7cb9 (tasty manifest kept across sync). Spun off as a separate task; none caused by tones/strict.

- `c2a6ad052` NEO-TYPE-09: `strict: ['colors']` world; positive .tsx (tokens, tones, keywords, css(), css prop, `r={{'@md':…}}`, free `width`) exits 0; six negatives each fail naming the value (JSX `bg="blue.500/50"` TS2820, `not-a-token`/`#fff` TS2322, `css({bg:'blue.500/50'})` TS2345, css prop TS2820, `r` TS2322). Sanity flip without strict: all negatives pass → the case tests strict. Orchestrator re-ran: PASS.

- `179ac9b57` S5a docs: `/palette` (neutrals vs 17 hues, in-use snippet) and `/colour` (shades and tones, roles, intensity, composition, role not just strength, complementary accents, four relationships, Enforcing tokens). color-composition.tsx on tones. Gate 0/0 (52 files), docs tsc exit 0, console clean, screenshots `.screenshots/localhost-5174/colors/after-*`. `/colors` route removed. Refiner `986e8a887`: fixed split-complementary (two dots), hue-angle comment, `/50` open-mode only, explicit Roles prop list, strict copy (no invented TS text; lib props not covered); added Custom tones section; 'Choosing a strength'; 375px clean; `/colors` → `/colour` redirect.
- S4 T17 probe written (uncommitted): host passes; container fails because `dist/npm/linux-x64-gnu` native (Oct 10) predates tones. T16 PASS. Linux native rebuilt via `pnpm pipeline build` (Dagger, 50 s; stamped; tone marker present in dist + tarball). T17 still red: matrix node_modules cache (Dagger cache volume) keys ignore rust tarball identity, so the old engine is reused. `f5a71818c` matrix node_modules cache key now includes the artifactHash of `@reference-ui/rust` and the linux target package (cache.test.ts +4 cases, mutation-checked). `e9fdbd345` T17: consumer tone `t17ProbeTone` (surface 12% / line 41%) on `color="t17ProbeInk/t17ProbeTone"` over a prebuilt lib icon; rule reads `var(--tones-t17-probe-tone-line)`, never the surface var; computed `color(srgb 0.717647 0.00784314 0.2 / 0.41)`; novelty gate and icon accounting extended.
- `7a052fd11` S5b contrast: nested panels on neutral chips (no tinted-on-tinted text), light tone ink 700 (amber 800), docs-only tone `fill` (70%) for meters. Text leaves ≥ 4.5:1 in both modes: light min 4.51 (was 2.19 after S5b; 43 failures → 0), dark min 5.54 (pre-tones 5.12). Panel titles 16–17.9:1 vs ~18–19.5 before: accepted. Orchestrator saw /diagram, /colour, /palette in light and dark, zero console errors.

## Type cost (after, 2026-10-13, same commands as baseline)

| | before | after | delta |
| --- | --- | --- | --- |
| lib `styled/types/index.d.ts` | 84716 B / 1457 lines | 86608 B / 1462 lines | +1892 B (+2.2%) |
| docs `styled/types/index.d.ts` | 85196 B | 87114 B | +1918 B (+2.3%) |
| docs `tsc --noEmit` (pnpm wrapper, median of 3) | 0.89 s | 1.04 s | +0.15 s |
| Types | 80541 | 92155 | +14% |
| Instantiations | 359143 | 365847 | +1.9% |
| Check time | 0.250 s | 0.395 s | +0.145 s |

The after run also checks the two new docs pages (colour-sections, colour-relationships, palette-demo: ~530 new lines of TSX), so not all of the delta is the tone types. `TonedColorToken` is a template literal type (`${ColorToken}/${ToneToken}`), not an expanded union, so the `.d.ts` grows by ~1.9 KB, not ~1.2k members. Instantiations barely move.
- `38eb97825` S5b diagrams on tones (53 literals removed; docs tone `solid` 70% for meter fills). Light-mode contrast regressed (43/155 text leaves < 4.5:1, worst 2.19:1); sent back: no stacked tints, 700 ink in light, re-measure.

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

## Verified at `e9fdbd345` (orchestrator re-ran, 2026-10-13)

- Everything under "Verified at `5862760f8`" above, plus:
- `pnpm agentneo run NEO-TYPE-09` PASS
- `pnpm agent test --packages=@matrix/chain-t17` Playwright 16/16, unit 4/4; `--packages=@matrix/chain-t16` Playwright 6/6
- pipeline `cache.test.ts` 15/15
- `pnpm agentdocs q` 0/0 (52 files); docs `tsc --noEmit` exit 0
- Browser: /diagram, /colour, /palette in light and dark, zero console errors (docs left in dark)

## Mission status

Tones S1–S6 landed end to end, including strict mode through ui.config.
Open, out of this mission (task chips offered to the owner):
- 12 pre-existing Neo case failures (5f9348cd6 harvest allowlist; 0e08d7cb9 tasty manifest).
- Lib shipped `.d.ts` reach unshipped `.reference-ui/` and undeclared `@reference-ui/react`/`styled`.
- Pipeline: native freshness by inputs stamp (Dagger linux build writes it; artifact cache keys on it; fail loudly on stale darwin-arm64/win32).
- Decided 2026-10-13 (owner agreed): no peer dependency on `@reference-ui/react` (it's a generated `0.0.0-neo` folder, not an npm package, and basic consumers never sync). Lib's published types become self-contained against its own shipped primitives; consumer strict covers consumer code only. A future opt-in (documented tsconfig `paths`) can extend it to lib props. `1ee98f2ef` post-emit rewrite repoints `@reference-ui/react|styled|types` and `.reference-ui/` specifiers at shipped `dist/runtime/reference-ui/` (2,408 specifiers in 78 d.ts; throws on an unshipped target; 7 unit tests). `32f4cbd92` smoke gate typechecks lib declarations with skipLibCheck false. Scratch consumer: 2,316 TS2307 → 9 (all from published icons 0.0.43, which needs an owner republish). Docs tsc exit 0; T17 PASS. `baf937272` Neo inlines the 37 tasty modules into published `types/types.d.mts` (declare namespace + aliases; throws on surviving rust/relative specifiers). `cace2aa1a` lib cleans 640 declarations before emit (22 stale files gone). Orchestrator restarted dev:lib + dev:docs on current code and rebuilt lib: 0 `@reference-ui/rust` specifiers in lib types; lib dist ships `AnimationToken`. Refiner `17ee18bc4` (triple-slash references rewritten) + `7649d154b` (tasty inliner: assert entry names exported, throw on `declare global/module`, code-point ordering). Smoke break test: a bare `@reference-ui/react` in Tabs.d.ts fails the gate; restored → PASS. Orchestrator re-ran: lib scripts 9/9, neo packager 34/34, smoke PASS, docs tsc 0, T17 consumer with lib declarations and skipLibCheck false → tsc exit 0. Splitter `index` stays undeclared (runtime-internal).
- Done 2026-10-13: `8a406db6c` split tokens/mod.rs (400→285; opacity.rs, negation.rs); `f6ff66b3d` composite braces resolve bare bases like whole braces (`{brand}`, `{brand/medium}` now agree in `1px solid {…}`; ambiguous custom-prop bases still fail closed; 7 tests). Orchestrator re-ran: cargo pass, vitest 320/320, q 0 violations; NEO-DIAG-05/67, TOKEN-11, TYPE-09 PASS. `f3954d295` + `072698d5d` Neo strict/layers wording. `eb15784b5` SPEC file refs. Open: a bare name in both sizes and spacing resolves to sizes (size props) — needs a decision.
- Smaller: `TGN-W-UNKNOWN-TOKEN-CATEGORY` for lib's 21 `animations` tokens is a parity gap (old core printed `AnimationToken`; the Rust typegen never did; invisible until 5862760f8 surfaced TGN warnings): landed `4da6b826d`: `AnimationToken` printed (omitted when empty, like fontSizes), `Tokens.animations`, `animation?: StylePropValue<AnimationToken | (string & {})>` (only while the alias prints), `animationName` stays open; warning gone in a fresh docs sync; typegen cargo/vitest 56/56/q pass, NEO-DIAG-59 + TOKEN-11 PASS (orchestrator re-ran). Same gap for durations, easings, letterSpacings, opacity, borders, gradients and sizes (follow-up); stale strict/layers wording in some Neo SPECs; TONES-12 closed: NEO-NAMER-01 recompiles every `ATM-*` station (now incl. ATM-TOKEN-19..23) and passes.

## Session wrap (2026-10-13)

Landed after the tones mission, all orchestrator-verified:
- `4da6b826d` typegen prints `AnimationToken`; `animation` typed `AnimationToken | (string & {})`.
- Lib self-contained published types: `1ee98f2ef`, `32f4cbd92`, `baf937272`, `cace2aa1a`, refiner `17ee18bc4` + `7649d154b`.
- Neo layers coverage + reference-rs test layout (mission `.agents/missions/neo-layers/LOG.md`): NEO-LAYERS-01..06, bare-import baseSystem reload fix `e5fc0d990` (+`82362c3b8`), atlas/styletrace/atomic/module-graph/typegen/canon/primitives/tasty in case shape (tasty `b20ada593`).
- Case convention: `case.json` in all 336 reference-rs cases, runner-enforced, Memex per-case index, AGENTS.md §7 (`885e80986`, `7a1d356e1`, `4b20a15a4`, `0026810cf`).
- Pipeline native freshness by inputs stamp: `0de92975a`, `c79563321`, refiner `5cade0206` (stale linux rebuilt in Dagger; stale non-buildable targets warn on local packs, refuse on explicit lists/release; CI keeps stamps; publish-native gated).
- Tasty scratch race: `e1aa93b3d` (per-writer mkdtemp roots), `811603ad7` (quality gate skips `.scratch`).
- module-graph README `dc5ac9dad`; atomic loose ends `8a406db6c`, `f6ff66b3d`, `eb15784b5`; Neo docs `f3954d295`, `072698d5d`.

### Final sweep at `5cade0206`
- pipeline tests 218/218; pipeline typecheck: only the 5 known TS2835
- `pnpm agentrs t`: complete suite PASS (vitest 690/690), q 0 violations
- `pnpm agentneo run` NEO-TYPE-01/07/09, NEO-DIAG-59/67, NEO-TOKEN-11, NEO-LAYERS-01/06, NEO-PARITY-02: PASS
- `pnpm agentdocs q` 0/0, docs tsc exit 0
- matrix T17 Playwright 16/16, T16 6/6
- working tree clean, no worktrees; 69 commits ahead of origin/public-release (not pushed)

### Still open
- Owner: republish `@reference-ui/icons` (0.0.43 breaks `skipLibCheck: false`); decide bare-name `sizes` vs `spacing` precedence.
- 12 pre-existing Neo failures (5f9348cd6, 0e08d7cb9).
- BAS-LAYER-01..04 (Rust base-system layers API); unprinted resolvable categories (durations, easings, letterSpacings, gradients, sizes).
- Pipeline: docs.yml artifact path mismatch; npm-fallback for unbuildable explicit targets; rust-compile only exercised for linux.
- Neo READMEs' claims differ from short case.json names (281/294); a republished bare upstream doesn't trigger a watch re-sync.
