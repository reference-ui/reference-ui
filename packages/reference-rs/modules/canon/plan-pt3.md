# Canon overlay lock-down (pt3)

Pt1 inverted the join. Pt2 freezes the harness (one SPEC ID, one named
station). This file is why the crate still feels unsound: **the overlay is
a Panda dump, not a language.** Two (actually three) data sources, aliases
that are not CSS, viewport breakpoints baked into the language, condition
keys that the lookup never consults, and a CSV string instead of types.

Do not hand-edit `src/`. Change `generate/` and run
`pnpm --filter @reference-ui/rust run canon`.

**Status:** complete.

---

## What is already decided (do not re-open)

Container-query-first. Viewport `sm` / `md` / `lg` / `xl` / `2xl` are **not**
the public language. Named breakpoint values live on the utterance
(`tokens({ breakpoints })` / base-system). Per-prop `{ md: 3 }` is forbidden.
The `r` prop and `@container` / `@sm` keys are the responsive surface.

Evidence: `docs/FEATURES/RESPONSIVE.md`, `typegen/SPEC.md` (`TYP-STYLE-03`),
`reference-core/docs/container-queries.md`, `reference-core/src/types/plan.md`.

Canon currently emits Panda's viewport scale as `DEFAULT_BREAKPOINTS` and
treats `sm` as a condition. That is the opposite of the decision.

---

## Diagnose

### Seven overlays pretending to be two layers

README says: platform (`@webref`) + dialect (`dictionary.ts`). The generator
actually joins:

| Blob | Job | Lives in |
| :--- | :--- | :--- |
| `@webref/css` + `@webref/elements` | living platform | `platform.ts` — keep |
| `CANONICAL_UTILITY_STRING` | class prefixes **and** aliases (`/1`, `/borderX`) | CSV in `dictionary.ts` |
| `CUSTOM_PREFIXES` | more prefixes, including collision patches | `dictionary.ts` |
| `KNOWN_ALIASES` | more aliases, including identities (`borderBlock` → `borderBlock`) | `dictionary.ts` |
| `DIALECT_CSS_ALLOWLIST` | fake CSS names so the join does not abort | `dictionary.ts` |
| `DIALECT_COLOR_ALLOWLIST` | kebab **and** camel of the same names; `background` is already webref | `dictionary.ts` |
| `CONDITION_KEYS` + `ORDERED_BREAKPOINTS` | Panda condition dump + viewport scale | `dictionary.ts` |

Then **core still has the original dialect**:

- `reference-core/.../panda/config/extensions/shorthands/border.ts` (`b`, `borderT`, `borderX`)
- `.../shorthands/outline.ts` (`ring` → `outline`)
- `.../color/utilities.ts` (`borderXC`, `ringColor`)
- `reference-core/src/types/public/colors.ts` (`COLOR_PROP_KEYS` includes `ringColor`, `borderXColor`, `divideColor`)

Canon tripwire 4 forbids secondary lists. The dump was copied into canon
instead of replacing the lists.

### Aliases that are not CSS

`ring` / `ringColor` / `ringOffset` / `ringWidth` are Tailwind names for
`outline*`. They are not CSS. Class prefix `ring` for `outline` is the same
lie. Source: Panda `outlineShorthandUtilities` defaults `shorthand: 'ring'`.

`b` → `border` collides with the `<b>` primitive. Border is a fine name.

`borderL` / `borderR` / `borderT` / `borderB` / `borderC` / `borderXC` /
`borderYC` / `borderXWidth` are a second naming system on top of CSS
(`borderLeft`, `borderInlineColor`). `borderX` is the same smell: X does
not mean inline in CSS; `borderInline` does. `px` / `mx` stay because they
are the one established spacing pair, not a general "star" rule.

Identity aliases (`borderInline` → `borderInline`, `borderBlock` →
`borderBlock`, `textShadowColor` → `textShadowColor`) are not aliases.

`x` / `y` / `z` as aliases steal SVG geometry / `zIndex`. Prefixes for
`translateX` / `translateY` may stay `x` / `y`; the **authoring** names must
be the CSS names.

The utility string `/1` **also** registers the class prefix as an alias, so
`KNOWN_ALIASES` and the CSV encode the same rows twice.

### Conditions: table is dead, dump is live

`is_condition` returns true for any `_` / `&` / `@` prefix. The 150
`_hover`-style rows in `CONDITIONS` are never searched. Bare keys that
**are** searched are the viewport breakpoints we already decided to remove.

So `CONDITION_KEYS` is neither a lookup source of truth nor a typed catalog
for typegen. It is a Panda paste.

### Typed TS side

`dictionary.ts` is `Record<string, string>`, `Set<string>`, and a CSV.
`webref.d.ts` types `listAll()`. After ingest, every name is still `string`.
You can add `borderXC: 'borderInlineColor'` and the only check is a runtime
join that says "yes, that target exists." That is not a language.

Emitters (`emitCssModRs`, …) are fine as formatters. They are not the
unsound part. The overlay they print is.

---

## Target architecture

Exactly two layers, each one typed table per job.

```
@webref  ──►  platform.ts  ──►  PlatformCss / PlatformElements
                                      │
typed overlay ──►  loadDialect()  ──►  DialectData
                                      │
                               fail-closed join
                                      │
                               emitters → src/*.rs
```

### Overlay tables (replace `dictionary.ts`)

One object per job. No CSV. No parallel map that restates the same fact.

| Table | Type intent | Contains |
| :--- | :--- | :--- |
| `PRIMITIVE_TAGS` | curated HTML/SVG host tags | already honest; keep |
| `SHORT_PREFIXES` | `satisfies Record<CanonicalName, string>` | unique class prefixes only |
| `ALIASES` | `satisfies Record<AliasName, CanonicalName>` | authoring sugar → CSS or named extension |
| `MACROS` | Reference-only props | `colorMode`, `r`, `size`, `variant`, `weight` |
| `EXTENSIONS` | dialect CSS that is not in webref | `{ name, css, classPrefix, color?: true }` |
| `NAMED_CONDITIONS` | typegen catalog, not membership | CSS-true `_hover` plus explicit dialect extras |

`CUSTOM_PREFIXES` and the `/1` / `/alias` CSV parser go away. Collision
patches (`d` → `svg-d`, `x` → `svg-x`) are rows in `SHORT_PREFIXES`.

`DIALECT_CSS_ALLOWLIST` **is** `EXTENSIONS`, not a second set the join
consults. `DIALECT_COLOR_ALLOWLIST` is `color: true` on those rows. Webref
color syntax stays on the platform table; do not re-list `background`.

### Type-safe Canon TS

1. `loadPlatformCss()` writes `generate/platform-names.generated.ts`:
   `export type PlatformProp = 'color' | 'marginTop' | …`
2. Overlay files `satisfies` those unions (plus `typeof EXTENSIONS[number]['name']`).
3. Join stays as the runtime fail-closed gate (poison tests still inject strings).
4. `pnpm canon` regenerates the union **and** the Rust. A new alias that
   targets a made-up name fails `tsc` before join.

Do not invent branded `&str` theater. `as const satisfies` plus a generated
union is the stable feeling.

---

## Alias policy (locked)

An alias is authoring sugar for a real name. It is not a parallel CSS.

**Must:**

- Target a platform property or a named `EXTENSIONS` row. Never another alias.
- Not equal its target (no identities).
- Not be a single letter that is also an HTML/SVG primitive (`b`, `a`, `i`, …).
- Not rename CSS into Tailwind (`ring*` → `outline*`).

**Keep** (LLM-safe, 1:1, cannot be read as another name):

- Spacing box: `m` `mt` `mb` `ml` `mr` `mx` `my` `p` `pt` `pb` `pl` `pr` `px` `py`
- Size: `w` `h` `minW` `minH` `maxW` `maxH`
- `bg` → `background`
- `flexDir` → `flexDirection` (lib authors it)

**Kill:**

- `ps` `pe` `ms` `me` (start/end collide with other abbreviations; write `paddingInlineStart`)
- `pos` `shadow` (write `position` / `boxShadow`)
- `b` → `border`
- `c` → `color`
- entire `rounded*` family; authors write `borderRadius`
- `borderL` `borderR` `borderT` `borderB` `borderC` `borderStartC` `borderEndC`
- `borderX` `borderY` `borderXC` `borderYC` `borderXWidth` `borderYWidth`
- entire `ring*` family; class prefixes for outline become `outline` / `outline-w` / `outline-c` / `outline-offset` (or other unique shorts that still say outline)
- `x` `y` `z` as aliases (SVG / `zIndex`). Prefixes for `translateX`/`translateY` may remain `x`/`y`; authoring is `translateX`.
- identity rows
- any alias that exists only because the CSV `/1` restated the prefix

`mx`/`px` stay. `borderX` does not. That is the "star" rule: spacing X/Y is
the one established pair; do not generalize it to borders, colors, or
insets. Authors write `borderInline` / `insetInline`.

If a keep-list name is unused in lib and unused in atomic goldens, it still
needs a SPEC station or it dies in the same change.

Shorthand **decomposition** (border value → width+style, omit color) is
atomic's job via webref longhands. It is not permission to invent `b`.

---

## Breakpoints (locked)

Canon is the language. An ordered viewport scale is an utterance.

- Delete `ORDERED_BREAKPOINTS` from canon generate.
- Do not emit `DEFAULT_BREAKPOINTS` as `base sm md lg xl 2xl`.
- `is_condition_prop("sm")` is **false**. Bare `sm` is not a condition key.
- `default_breakpoint_for_index` leaves canon. Atomic (or compile input from
  base-system) owns array-slot → named scale. `ATM-LEAF-05` is that crate's
  follow-up; do not quietly keep the Panda scale here "so atomic compiles."
- Array sugar is not a reason to put viewport names in the language. If arrays
  remain, their scale is injected at compile time from tokens, not from
  canon.

`CAN-COND-01` and `CAN-COND-04` as written are wrong. Rewrite them:

- `CAN-COND-01` — grammar: `_` / `&` / `@` open; bare `hover` false; bare
  `sm` false.
- `CAN-COND-04` — move to atomic, or replace with "canon has no default
  viewport scale" (`default_breakpoint_for_index` absent).

---

## Condition keys (locked)

Two different jobs. Split them.

1. **Grammar** (`is_condition`): `_` / `&` / `@` are open discriminators.
   Bare names are not conditions. This is already true; stop stuffing the
   table with rows the function never reads.
2. **Named catalog** (`NAMED_CONDITIONS`): closed list for typegen
   autocomplete. CSS-true pseudos mapped `_hover` ← `:hover`, plus an
   **explicit** dialect extras table (`_dark`, `_light`, `_groupHover`,
   `_peerFocus`, `_osDark`, `_motionReduce`, …). Not 150 Panda names.

Source of truth:

- CSS-true: typed list we own, names taken from Selectors (not a second
  npm dump unless `@webref` grows a selector catalog we actually call).
- Dialect extras: typed list we own, each row a SPEC-worthy name.
- Breakpoint token names: **not here**. Utterance.

`CONDITIONS` in Rust either becomes `NAMED_CONDITIONS` (catalog) or goes
away if nothing binary-searches it. Do not keep a slice that looks like a
closed membership test while lookup is open.

---

## Dialect extensions & color

Classify every `DIALECT_CSS_ALLOWLIST` entry:

| Kind | Action |
| :--- | :--- |
| Already in `@webref` | delete from overlay |
| Tailwind/Panda theater (`focus-ring*`, `divide-*` as CSS) | kill unless a named SPEC case says Reference authors it |
| Real dialect (`spaceX`, `srOnly`, `textStyle`, gradient stops, `boxSize`) | one `EXTENSIONS` row, unique prefix, `color: true` iff it takes a color token |

`background` in the color allowlist is a bug. Webref already marks it.
`divideColor` / `focusRingColor` die with their extensions unless SPEC
keeps them as named dialect.

---

## SPEC / test fallout (canon only)

Rewrite, do not preserve:

- `CAN-ALIAS-01`–`04` — names from the keep list. No `borderX`, no `ringColor`.
- `CAN-PROP-07` — `c` `bg` stay; drop `borderC` `borderXC` `ringColor`.
- `CAN-COND-01` / `04` — per breakpoints lock above.
- `CAN-ALIAS-06` (pt2) — if `borderX` dies, pick a remaining alias-to-shorthand
  (`px` → `paddingInline`) or drop the case.

Pt2 harness rules still apply after this: one ID, one named station,
proof map points at tests. Do not execute pt2 against the dump.

---

## Out of scope (other crates; named so they are not absorbed)

- Deleting Panda `extensions/shorthands` while Panda still emits the sheet.
  They remain the **legacy** dialect until cutover. Canon stops copying them.
- Rewriting `COLOR_PROP_KEYS` in core / MCP constants (tripwire 4 in those
  packages: they query canon).
- `ATM-LEAF-05` array → token scale (atomic + base-system).
- Typegen `TYP-STYLE-03` consuming `NAMED_CONDITIONS`.
- Re-subsetting platform CSS. Full webref stays.
- `tests/cases/CAN-*`, N-API seams, hand-editing `src/`.

---

## Phases

After each phase: `pnpm --filter @reference-ui/rust run canon`,
`pnpm agentrs c canon`, `pnpm agentrs v canon`,
`pnpm agentrs q packages/reference-rs/modules/canon`.

### 1. Typed overlay skeleton

**Files:** replace `dictionary.ts` with typed tables; `dialect.ts` only
joins; generate `platform-names.generated.ts`.

- Kill `CANONICAL_UTILITY_STRING` and its parser.
- `SHORT_PREFIXES` + `ALIASES` as `as const satisfies`.
- `EXTENSIONS` replaces both allowlist sets.
- Generate the platform name union so overlay targets typecheck.

**Proof:** `tsc` on generate fails if an alias target is not a platform or
extension name. CSV grep in `generate/` is empty.

### 2. Prune aliases and prefixes

Apply the keep/kill lists. Outline prefixes are outline, not ring.
Drop identity aliases and `/1` duplicates.

**Proof:** emitted `ALIASES` has no `b`, `borderX`, `borderXC`, `ring`,
`ringColor`. `class_prefix_for_prop("outline")` is not `ring`. Join still
unique-prefix green.

### 3. Conditions and breakpoints

- Remove `ORDERED_BREAKPOINTS` / `DEFAULT_BREAKPOINTS`.
- Remove `default_breakpoint_for_index` from canon.
- Split grammar vs `NAMED_CONDITIONS`.
- Prune `CONDITION_KEYS` to CSS-true + explicit extras.

**Proof:** `is_condition_prop("sm")` is false. `_hover` still true (open `_`).
No `DEFAULT_BREAKPOINTS` in `src/`. Atomic may go red; that is the listed
follow-up, not a reason to revert.

### 4. SPEC + generated tests

Update SPEC cases and emitters-tests to the keep list and the condition
grammar. Then do pt2 named-station work against **these** names.

**Proof:** SPEC does not mention `borderX`, `ringColor`, or `sm` as
language. `CAN-COND-04` is not a canon station for a Panda scale.

### 5. Honesty pass

```bash
rg -n "CANONICAL_UTILITY_STRING|ringColor|borderXC|ORDERED_BREAKPOINTS" packages/reference-rs/modules/canon
rg -n "DEFAULT_BREAKPOINTS|borderX" packages/reference-rs/modules/canon/src
```

First grep: only this plan file and (until cutover) SPEC history if any.
Generated `src/` must be clean.

Mark this file **Status: complete** only after the four verify commands pass
and the greps are clean.

---

## Freeze rule

After status is complete:

- New alias / prefix / extension / named condition is a typed overlay row
  **and** a SPEC ID **and** a named station in the same change.
- A name that is not CSS and not a named extension is a bug, not sugar.
- Viewport breakpoint names do not return to canon.
- Core / MCP / Panda extension copies are debt. They must not be copied
  back into `generate/`.
