# CSS group ledger — `NEO-CSS-*`

Statuses: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. Ids are append-only; never renumber.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-CSS-01 | Runtime `css()` paints from compiled plans | done | none | `css.ts`, `plans.ts` | sheet carries exactly the wanted utilities; brand/ink/spacing paint; hover twin paints | existing case |
| NEO-CSS-02 | `css()` at build time and runtime lower responsive sugar to the same class | done | ATM-COND-01 | `lowerResponsiveStyles.ts` | one container utility in sheet; both forms resolve to it; paints only in matching containers | existing case; cross-ref RESP-09 |
| NEO-CSS-03 | Shorthand alias `w` last-wins over a responsive `width` object | done | ATM-COND-17, ATM-MERGE-01/02 | `plans.ts`, `css.ts` | computed width at all widths | `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "should resolve shorthand" |
| NEO-CSS-04 | Unitless numbers: `opacity: 1`, `zIndex: 0`, `width: 42` → `42px`, `--foo: 42` | done | ATM-UNIT-01/02 | — | computed each | `[panda-v1]` `core/__tests__/rule-processor.test.ts` "unitless" |
| NEO-CSS-05 | `null`, `false`, `undefined` leaves emit nothing and no ghost class | done | ATM-LEAF-03, ATM-GHOST-02 | `css.ts` | utility count; class string | `[panda-v1]` `core/__tests__/rule-processor.test.ts` "ignores null"; `[decision D11]` |
| NEO-CSS-06 | Token refs inside function values (`linear-gradient({colors.a}, {colors.b})`) resolve | done | ATM-TOKEN-08 | — | computed background-image | `[panda-v1]` `core/__tests__/gradient.test.ts` |
| NEO-CSS-07 | Arbitrary values (`rgba(…)`, `color-mix(in oklch, currentColor 14%, transparent)`, `calc(…)`) are one class each and paint | done | ATM-NAME-*, ATM-LEAF-* | — | computed; exactly one utility | `[lib]` styles-css L27446 |
| NEO-CSS-08 | `!important` spellings — `'red!'`, `'red !important'`, `'red!IMPORTANT'`, and quoted `content: '"hello!"'` (not important) | done | ATM-LEAF-09/10 | `css.ts` | important beats a later plain utility; content string intact | `[atm]` P0 #5; `[panda-v1]` `core/__tests__/atomic-rule.test.ts` "respect important syntax" |
| NEO-CSS-09 | Escaping grammar round-trips: dots, slashes, brackets, parens, percent, quotes, commas in class names | done | ATM-NAME-01..07 | — | each class in DOM matches a sheet rule (computed) | `[lib]` styles-css §3 grammar row; `[panda-v1]` `core/__tests__/classname.test.ts`, `shared/__tests__/esc.test.ts` |
| NEO-CSS-10 | Macros `size`, `font`, `weight` expand to multiple declarations from one prop | done | ATM-COND-05/16 | — | width+height; family+weight | `[atm]` P1 #9; `[lib]` `size_` → width+height |
| NEO-CSS-11 | Authored custom properties keep casing (`--testVariable0`) | done | ATM-NAME-* | — | `getPropertyValue('--testVariable0')` | `[panda-v1]` `core/__tests__/rule-processor.test.ts` "preserves casing" |
| NEO-CSS-12 | Rhythm values `4r`, `3.5r`, `1/2r` lower to `calc()` over `var(--spacing-root)` (no per-key spacing vars) | done | ATM-RHYTHM-01..05 | — | computed px at a known root | `[lib]` global-css Trace B/E; `[atm]` P1 #8 |

## RS-9 — per-prop responsive objects + alias eviction (blocks NEO-CSS-03)

R1 2026-09-17: `css({ width: { base: '50px', md: '60px' }, w: '70px' })`
through `compile()` warns `Dynamic non-literal expression encountered for
prop 'width'` (`extract/expressions/walk.rs`, object values on style props
fall through to the dynamic branch) and emits only `.w_70px` — no width
wants, no width plans. No `ATM-*` station covers per-prop objects; COND-01
covers arrays only. Probe: `/tmp/css-r1-probe.mts`, `/tmp/css-r1-probe2.mts`.

Input style object: `css({ width: { base: '50px', md: '60px' }, w: '70px' })`.

Expected CSS: utilities carry all three atoms — `.w_50px { width: 50px; }`,
`@container (min-width: 768px) { .md\:w_60px { width: 60px; } }`,
`.w_70px { width: 70px; }` — with plans keyed by authored spellings (the
object value included). Panda drops the shadowed atoms at compile time
(only `.w_70px`); Neo keeps every atom per MERGE-01, so the slice must
also design the runtime eviction: a later alias of the same property
evicts the earlier responsive expansion at merge time (distinct slots
`width@base`/`width@md` vs `width` never collide under current slot
last-wins, and `plans.ts` mirrors engine `js/plans.ts` exactly — the
eviction semantic needs engine+runtime agreement, not a Neo-only tweak).

Should become: station ATM-COND-17 (per-prop `{ base, <bp> }` objects;
`base` unconditioned per `resolve/conditions`, unknown keys warn+skip like
COND-07) plus a merge note covering the eviction.

Landed 2026-09-17 as ATM-COND-17 (merge note in `js/plans.ts` +
`tests/merge-eviction.test.ts`); NEO-CSS-03 done (proof: computed width
70px at all container widths). Note: NEO-RESP-03 (`base` key) needs the
same compilation half (resp group).
