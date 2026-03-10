# Styled system migration: reference-core → reference-cli

Plan for moving the styled extension API and related machinery from `reference-core` into `reference-cli`. Opinionated styles (e.g. specific token scales, themes) live elsewhere; this is about the **extension surface** and **custom props** we want to support.

---

## 1. Goals and constraints

- **Move** the styled system we create into the CLI so the CLI owns config generation, fragments, and (eventually) box pattern.
- **Split out** opinionated styles into a separate place (not in scope here).
- **Copy over** the extension API and the ideas behind box pattern; simplify where the old setup was messy.
- **Single export surface:** what’s public vs private is determined only by what we export from `entry/system`. No separate “internal” vs “system” module split; same naming as the API we expose (`tokens`, `keyframes`, `utilities`, etc.).

---

## 2. Current state

### reference-core styled API

- **`styled/api/internal/`** – “internal” extenders, all call into `extendPandaConfig` (or box pattern):
  - `extendTokens`, `extendRecipe`, `extendSlotRecipe`
  - `extendKeyframes`, `extendFont`, `extendGlobalFontface`
  - `extendGlobalCss`, `extendStaticCss`
  - `extendUtilities`
  - `extendPattern` (re-export of `extendBoxPattern` from `cli/system/config/boxPattern`)
- **`styled/api/system/index.ts`** – “public” API: re-exports with friendlier names (`tokens`, `recipe`, `keyframes`, `font`, `globalCss`). **Note:** `extendUtilities` is not currently exposed here.
- **Duplication:** two layers (internal vs system) with different names for the same thing. We want one implementation and one naming scheme; visibility = what `entry/system` exports.

### reference-core box pattern (defer details)

- **`reference-core/src/cli/system/config/boxPattern/`**
  - `extendBoxPattern(extension)` – user API; pushes `{ properties, transform }` onto a global collector.
  - `createBoxPattern` – runs extend files, collects extensions, **generates** `styled/props/box.ts`.
- **Generated `styled/props/box.ts`** – calls `extendPandaConfig` with one big Panda `patterns.extend.box` (jsx, properties, blocklist, transform). The transform wires in rhythm (`r`), font presets, container, etc.
- **Why it existed:** to let multiple sources (rhythm, font, container) contribute to one box pattern without each knowing the full shape. Exact requirements to preserve TBD; we’ll design a cleaner version once the API is in the CLI.

### reference-core custom props (transfer later)

- **`styled/rhythm/utilities.ts`** – rhythm-based utilities (e.g. spacing); uses `extendUtilities` and `resolveRhythm`.
- **`styled/rhythm/helpers.ts`** – rhythm resolution helpers.
- **`styled/props/box.ts`** – generated; defines box pattern (font, weight, container, `r`, etc.).
- **`styled/props/container.ts`**, **`styled/props/font.ts`**, **`styled/props/index.ts`** – prop definitions and combined `SystemProps`.
- This area is “really messy”; we want to **transfer it into the new system** after the API and box-pattern story are clear, not before.

---

## 3. Phase 1: API in the CLI (naming + export surface)

**Objective:** Implement the extension API in the CLI with a single, consistent naming scheme. Public = what we export from `entry/system`.

### 3.1 Naming convention

- **Same names as the public API:** `tokens`, `keyframes`, `utilities`, `recipe`, `slotRecipe`, `font`, `globalCss` (and any others we decide to support).
- No “extend*” in the exported names; internal implementation can still be “extend” style (e.g. fragment collectors that merge into Panda config).
- What determines public vs private is **only** what we export from `entry/system.ts`.

### 3.2 What to copy / implement

| reference-core (internal) | CLI action | Export from entry/system |
|---------------------------|------------|---------------------------|
| extendTokens              | Fragment collector | `tokens` ✓ |
| extendKeyframes           | Fragment collector | `keyframes` ✓ |
| extendUtilities           | Fragment collector | `utilities` ✓ |
| extendGlobalCss           | Fragment collector | `globalCss` ✓ |
| extendStaticCss           | Fragment collector | `staticCss` ✓ |
| extendGlobalFontface      | Fragment collector | `globalFontface` ✓ |
| extendRecipe              | Add recipe fragment collector              | `recipe` (next) |
| extendSlotRecipe          | Add slotRecipe fragment collector         | `slotRecipe` (next) |
| extendFont                | Add font fragment collector (calls multiple functions) | `font` (next) |

- **Do not** duplicate “internal” vs “system” in the CLI. Implement each piece once (e.g. in `system/api/`) and re-export the public name from `entry/system.ts`.
- Alias `@reference-ui/system` in fragment bundling so user files that call `keyframes()`, `utilities()`, etc. resolve to the CLI’s implementation (same pattern as for `tokens`).

### 3.3 Implementation approach

- Follow the existing **fragment collector** pattern used for `tokens`:
  - Collector with `targetFunction` (e.g. `keyframes`, `utilities`).
  - Scan for that function name in user files.
  - Bundle fragment files with alias for `@reference-ui/system`.
  - Merge collected fragments into generated Panda config (e.g. theme keyframes, utilities extend).
- Add collectors and wire them in `system/config/runConfig.ts` (and any config generation) so they’re included in `createPandaConfig` / Liquid template.
- Ensure the CLI’s `entry/system.ts` (and thus the packaged `@reference-ui/system`) exports only: `tokens`, `keyframes`, `utilities`, `recipe`, `slotRecipe`, `font`, `globalCss` (and any others we agree on). No “internal” barrel.

### 3.4 Reference-core code to lean on

- **API shape and types:**  
  `reference-core/src/styled/api/internal/extendKeyframes.ts`,  
  `extendUtilities.ts`, `extendRecipe.ts`, `extendFont.ts`, `extendGlobalCss.ts`
- **Public naming / docs:**  
  `reference-core/src/styled/api/system/index.ts`  
  Use the same JSDoc and examples where applicable; implementation will be fragment-based in the CLI, not `extendPandaConfig`-based.

---

## 4. Phase 2: extendBoxPattern and box pattern (after API)

**Objective:** Decide how box pattern fits into the CLI and what we keep from the old “extendBoxPattern” idea.

### 4.1 What the old box pattern did

- **User-facing:** `extendBoxPattern({ properties, transform })` – register extra properties and a transform for the single “box” pattern.
- **Build-time:** `createBoxPattern` ran files that called `extendBoxPattern`, collected all extensions, then **generated** `styled/props/box.ts` which called `extendPandaConfig` with one combined `patterns.extend.box` (jsx, properties, blocklist, transform).
- The generated transform composed rhythm (`r`), font presets, container, and other custom props. So box pattern was the “glue” that made those props available on primitives.

### 4.2 Open questions

- Do we still need a **collect-and-generate** step (multiple sources → one generated box pattern), or can we express the same behaviour with a fixed pattern + fragment-based utilities/keyframes/tokens?
- Should “box pattern” live in the CLI as a **built-in pattern** (no user extendBoxPattern), or do we want a simplified `extendBoxPattern`-style API (e.g. “add properties” only)?
- How do we avoid the “weird duplication” and the wildness of the old setup while still supporting rhythm, container, and font props?

### 4.3 Next steps (after Phase 1)

- Document the exact behaviour we need from box (which props, which transforms, how they interact with rhythm/container/font).
- Prototype in the CLI: either a single generated box pattern (like today) or a smaller, fixed pattern + utilities.
- Only then copy or adapt `reference-core/src/cli/system/config/boxPattern` (and any generate scripts) into the CLI.

---

## 5. Phase 3: Custom props (rhythm, box, container, font)

**Objective:** Move the custom props we care about into the new system, once the API and box pattern are in place.

### 5.1 Sources in reference-core

- **`styled/rhythm/utilities.ts`** – rhythm utilities (uses `extendUtilities` + `resolveRhythm`).
- **`styled/rhythm/helpers.ts`** – rhythm resolution.
- **`styled/props/box.ts`** – generated; box pattern definition.
- **`styled/props/container.ts`**, **`styled/props/font.ts`**, **`styled/props/index.ts`** – prop types and SystemProps.

### 5.2 Approach

- Treat this as “really messy” and **do it after** Phase 1 and Phase 2.
- Once we have `utilities` (and optionally box pattern) in the CLI, we can:
  - Port rhythm utilities and helpers into the CLI (or a dedicated package that the CLI consumes).
  - Define container/font/box prop types and wire them into the chosen box pattern (or equivalent).
- We may refactor heavily (e.g. clearer split between “utilities” and “pattern props”) rather than copying the old structure 1:1.

---

## 6. Summary

| Phase | Focus | Outcome |
|-------|--------|--------|
| **1** | API in CLI, single naming | `tokens`, `keyframes`, `utilities`, `recipe`, `slotRecipe`, `font`, `globalCss` implemented and exported from `entry/system`; no internal/system duplication. |
| **2** | extendBoxPattern / box pattern | Design and implement box pattern (or simplified equivalent) in the CLI; clarify whether we keep an extendBoxPattern-style API. |
| **3** | Custom props | Port rhythm, box, container, font props into the new system; clean up as we go. |

**Immediate next step:** implement Phase 1 – add keyframes, utilities, recipe, slotRecipe, font, globalCss to the CLI using the same fragment-collector and export pattern as `tokens`, and document any type/config shapes we take from reference-core.
