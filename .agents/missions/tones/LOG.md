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
| S2b | ATM-TOKEN-19..23 stations + SPEC + NEO-DIAG-67 | NOT STARTED — brief ready: `briefs/S2b.stations.md` |
| S4 | T17 consumer tone probe | not started |
| S5 | docs: palette + colour pages, diagram migration | not started (before screenshots taken) |

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

## Verified at `0d5892428`

- `pnpm agentrs c atomic` 826 lib unit tests (+14 integration) passed
- `pnpm agentrs v atomic` 315 passed, no unintended golden drift
- `pnpm agentrs c typegen` 73 passed; `pnpm agentrs v typegen` 51 passed
- `pnpm agentrs c base_system` 85 passed; `base-system --check` current
- `pnpm agentrs c --crate diagnostics` 37 passed
- `pnpm agentrs q` 0 code violations (109 warnings repo-wide)

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
