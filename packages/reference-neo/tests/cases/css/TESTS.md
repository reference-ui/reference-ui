# CSS group ledger — `NEO-CSS-*`

Statuses: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. Ids are append-only; never renumber.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-CSS-01 | Runtime `css()` paints from compiled plans | done | none | `css.ts`, `plans.ts` | sheet carries exactly the wanted utilities; brand/ink/spacing paint; hover twin paints | existing case |
| NEO-CSS-02 | `css()` at build time and runtime lower responsive sugar to the same class | done | ATM-COND-01 | `lowerResponsiveStyles.ts` | one container utility in sheet; both forms resolve to it; paints only in matching containers | existing case; cross-ref RESP-09 |
| NEO-CSS-03 | Shorthand alias `w` last-wins over a responsive `width` object | done | ATM-COND-17, ATM-MERGE-01/02 | `plans.ts`, `css.ts` | computed width at all widths | Panda v1 test "should resolve shorthand" |
| NEO-CSS-04 | Unitless numbers: `opacity: 1`, `zIndex: 0`, `width: 42` → `42px`, `--foo: 42` | done | ATM-UNIT-01/02 | — | computed each | Panda v1 test "unitless" |
| NEO-CSS-05 | `null`, `false`, `undefined` leaves emit nothing and no ghost class | done | ATM-LEAF-03, ATM-GHOST-02 | `css.ts` | utility count; class string | Panda v1 test "ignores null" |
| NEO-CSS-06 | Token refs inside function values (`linear-gradient({colors.a}, {colors.b})`) resolve | done | ATM-TOKEN-08 | — | computed background-image | Panda v1 gradient tests |
| NEO-CSS-07 | Arbitrary values (`rgba(…)`, `color-mix(in oklch, currentColor 14%, transparent)`, `calc(…)`) are one class each and paint | done | ATM-NAME-*, ATM-LEAF-* | — | computed; exactly one utility | reference-lib styles-css L27446 |
| NEO-CSS-08 | `!important` spellings — `'red!'`, `'red !important'`, `'red!IMPORTANT'`, and quoted `content: '"hello!"'` (not important) | done | ATM-LEAF-09/10 | `css.ts` | important beats a later plain utility; content string intact | Panda v1 test "respect important syntax"; StyleProp bang rides this claim (K1/K2) |
| NEO-CSS-09 | Escaping grammar round-trips: dots, slashes, brackets, parens, percent, quotes, commas in class names | done | ATM-NAME-01..07 | — | each class in DOM matches a sheet rule (computed) | reference-lib styles-css §3 grammar row; Panda v1 classname and escape tests |
| NEO-CSS-10 | Macros `size`, `font`, `weight` expand to multiple declarations from one prop | done | ATM-COND-05/16 | — | width+height; family+weight | reference-lib `size_` → width+height |
| NEO-CSS-11 | Authored custom properties keep casing (`--testVariable0`) | done | ATM-NAME-* | — | `getPropertyValue('--testVariable0')` | Panda v1 test "preserves casing" |
| NEO-CSS-12 | Rhythm values `4r`, `3.5r`, `1/2r` lower to `calc()` over `var(--spacing-root)` (no per-key spacing vars) | done | ATM-RHYTHM-01..05 | — | computed px at a known root | reference-lib global-css Trace B/E |
| NEO-CSS-13 | `flex` keywords map to Panda triples (`1`→`1 1 0%`, `auto`→`1 1 auto`, `initial`→`0 1 auto`, `none`) with raw passthrough otherwise and zero grow/shrink/basis longhands | done | ATM-SHORT-11 | — | sheet triples + raws; computed grow/shrink/basis per item incl. the `0%`-vs-`auto` basis split | ATM-SHORT-11 |
| NEO-CSS-14 | Harvest floor: a dynamic-site color from a palette array no static site reads paints through harvested plans once the palette colors are declared as tokens; an unwritten color paints nothing with exactly one dev console diagnostic; neither bundle carries a per-atom row | done | ATM-HARVEST-01..04, 07 | `plans.ts`, `css.ts` | probe/pick computed colors; miss class unbacked on ink + one diagnostic; no red/blue rows in styled + react bundles; frozen recompile warns twice + one sink info counting 2 | `[forge]` Slice 4 §2 |
| NEO-CSS-15 | `css()` base + `@media (min-width: 840px)` branch on one class gates per viewport width | done | none (P2 census; no engine gap) | — | 760px base paints; 960px queried padding + colours paint; sheet carries the 840px block | `[matrix]` `css-contract.spec.ts` viewport pair; P-css-1 |

## RS-9 — per-prop responsive objects + alias eviction (blocks NEO-CSS-03)

`css({ width: { base: '50px', md: '60px' }, w: '70px' })`
through `compile()` warns `Dynamic non-literal expression encountered for
prop 'width'` (`extract/expressions/walk.rs`, object values on style props
fall through to the dynamic branch) and emits only `.w_70px` — no width
wants, no width plans. No `ATM-*` case covers per-prop objects; COND-01
covers arrays only.

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

Should become: reference-rs case ATM-COND-17 (per-prop `{ base, <bp> }` objects;
`base` unconditioned per `resolve/conditions`, unknown keys warn+skip like
COND-07) plus a merge note covering the eviction.

NEO-CSS-03 done (proof: computed width
70px at all container widths). Note: NEO-RESP-03 (`base` key) needs the
same compilation half (resp group).
