# OPERATION CONTINUITY-01 — Crew REPRO report

Verification only. No source edits, no commits, no snapshot writes. All runs
executed against fixtures in `/tmp/continuity-repro/` (outside the repo tree).

## 1. Style-collection entry (the real build path)

`ref sync` — the Neo CLI — is the single live style-collection entry:

- CLI: `packages/reference-neo/bin/ref.ts` → `src/cli/sync.ts` (`runSyncCommand`)
  → `src/sync/index.ts` (`sync()`), then the Rust `compile()` handshake.
- `@reference-ui/lib` itself builds through it:
  `packages/reference-lib/package.json` → `"sync": "node ../reference-neo/bin/ref.ts sync"`,
  and `dev`/`build` both run `sync` first. `docs/THEMING.md` Approach 4's "collection
  law" describes this same command.
- Collection covers both `css()`/`recipe()` literal call sites (Neo scan) and
  JSX StyleProps on known hosts (Rust atomic `extract/jsx` + `extract/css`).
  Rhythm lowering is generic `f64` math in
  `packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs`
  (`resolve_single_rhythm` parses any `N[fraction]r`, no scale table).
- No alternate live path found: no Vite plugin ships in `packages/reference-rs`
  (`js/` does not exist at package root), and `pipeline/src/build/` is
  workspace/cache plumbing, not a style collector.

## 2. Fixture (`/tmp/continuity-repro/`, preserved for re-run)

`ui.config.ts` (name `continuity`, `include: ['src/**/*.{js,ts,tsx}']`;
`node_modules/@reference-ui/neo` symlinked to the workspace package, mirroring
an installed project; `node_modules/react` symlinked to the workspace React
19.2.4 for the runtime probe only):

`src/tokens.ts` — `colors.brand #7c3aed`, `colors.ink #111111`, `spacing.sm 0.5rem`.

`src/app.ts` (`css()` object form, `maxWidth` longhand):

```ts
import { css } from '@reference-ui/react'
export const controlToken = css({ color: 'brand' })          // control: named token
export const controlRhythm = css({ maxWidth: '120r' })       // control: "known" rhythm
export const probe140 = css({ maxWidth: '140r' })            // probe: unseen rhythm
export const probe137 = css({ maxWidth: '137.5r' })          // probe: unseen fractional rhythm
export const probeRgba = css({ color: 'rgba(9, 87, 231, 0.33)' }) // probe: loose literal
```

`src/app-jsx.tsx` (HQ's exact JSX-prop form, `maxW` alias on a primitive host):

```tsx
import { Div } from '@reference-ui/react'
export const jControlToken = <Div color="brand">a</Div>
export const jControlRhythm = <Div maxW="120r">b</Div>
export const jProbe140 = <Div maxW="140r">c</Div>
export const jProbe137 = <Div maxW="137.5r">d</Div>
export const jProbe200 = <Div maxW="200r">e</Div>
export const jProbeRgba = <Div color="rgba(9, 87, 231, 0.33)">f</Div>
```

## 3. Exact commands run

```bash
# Run 1 — compiled bin, css() fixture only:
cd /tmp/continuity-repro && node /Users/ryn/Developer/reference-ui/packages/reference-neo/dist/bin/ref.js sync
# → "[neo] [ref] Built reference in 0.04s / ⎔ ref sync ⫶ 223 ms ⫶ 1.5 MB", EXIT=0

# Run 2 — compiled bin, after adding src/app-jsx.tsx:
cd /tmp/continuity-repro && node /Users/ryn/Developer/reference-ui/packages/reference-neo/dist/bin/ref.js sync
# → "[neo] [ref] Built reference in 0.02s / ⎔ ref sync ⫶ 103 ms ⫶ 1.5 MB", EXIT=0

# Run 3 — direct-source bin (freshest code, no build), JSON diagnostics:
cd /tmp/continuity-repro && node /Users/ryn/Developer/reference-ui/packages/reference-neo/bin/ref.ts sync --json --quiet
# → stdout `[]`, stderr empty, EXIT=0

# Run 4 — runtime cross-check (generated bundle + real React):
cd /tmp/continuity-repro && node probe.mjs   # imports ./.reference-ui/react/react.mjs, calls css()
```

## 4. Generated CSS — emit-or-absent per value

Source: `/tmp/continuity-repro/.reference-ui/styled/styles.css`, `@layer utilities`
(identical across Runs 2 and 3 — byte-identical emit from built and source bins):

```css
@layer utilities {
  .continuity__c_rgba\(9\,_87\,_231\,_0\.33\) { color: rgba(9, 87, 231, 0.33); }
  .continuity__c_brand { color: var(--colors-brand); }
  .continuity__max-w_120r { max-width: calc(120 * var(--spacing-root)); }
  .continuity__max-w_137\.5r { max-width: calc(137.5 * var(--spacing-root)); }
  .continuity__max-w_140r { max-width: calc(140 * var(--spacing-root)); }
  .continuity__max-w_200r { max-width: calc(200 * var(--spacing-root)); }
  .continuity__max-w_120r { max-width: calc(120 * var(--spacing-root)); }
  .continuity__max-w_137\.5r { max-width: calc(137.5 * var(--spacing-root)); }
  .continuity__max-w_140r { max-width: calc(140 * var(--spacing-root)); }
}
```

| Value | Form | Emitted? | Evidence |
|---|---|---|---|
| `brand` (control token) | `css()` + JSX | YES | `.continuity__c_brand { color: var(--colors-brand); }` |
| `120r` (control rhythm) | `css()` + JSX | YES | `.continuity__max-w_120r { max-width: calc(120 * var(--spacing-root)); }` |
| `140r` (unseen rhythm) | `css()` + JSX | YES | `.continuity__max-w_140r { max-width: calc(140 * var(--spacing-root)); }` |
| `137.5r` (unseen fractional) | `css()` + JSX | YES | `.continuity__max-w_137\.5r { max-width: calc(137.5 * var(--spacing-root)); }` |
| `200r` (HQ "known") | JSX | YES | `.continuity__max-w_200r { max-width: calc(200 * var(--spacing-root)); }` |
| `rgba(9, 87, 231, 0.33)` (loose) | `css()` + JSX | YES | `.continuity__c_rgba\(9\,_87\,_231\,_0\.33\) { color: rgba(9, 87, 231, 0.33); }` |

Runtime cross-check (Run 4) — generated `css()` returns exactly the sheet's
class names, so every emitted rule is reachable (no miss warnings):

```
css maxWidth 120r   -> continuity__max-w_120r
css maxWidth 140r   -> continuity__max-w_140r
css maxWidth 137.5r -> continuity__max-w_137.5r
css maxWidth 200r   -> continuity__max-w_200r
css color brand     -> continuity__c_brand
css color rgba      -> continuity__c_rgba(9,_87,_231,_0.33)
css maxW(alias)140  -> continuity__max-w_140r
```

## 5. Warnings / errors

None. All three sync runs exited 0; `--json` diagnostics printed `[]` with
empty stderr. No "unknown value", "unresolved", or dropped-want diagnostic of
any kind. (Values that extraction cannot see fail silent by design per the
collection law — but here nothing was dropped: every probe emitted.)

## 6. Incidental observations (not the suspected bug)

1. **Duplicate utility rules**: `max-w_120r`, `max-w_137.5r`, `max-w_140r`
   each appear twice (once per host form — `css()` + JSX — without emitter
   dedup). Harmless (identical rules), but bloat-adjacent; flagging for the
   owning crew.
2. **`--spacing-root` is author-defined, not auto-emitted.** The fixture's
   tokens layer carries only `--colors-*`/`--spacing-sm`; nothing defines
   `--spacing-root`, so the emitted `calc(N * var(--spacing-root))` rules
   reference an undefined variable until the author sets it (e.g. via
   `globalCss` `:root`, per `src/collect/surface/globalCss.ts`). Emit works;
   paint additionally requires that definition. If HQ's "compiles to nothing"
   was observed visually (nothing paints) rather than in the sheet, a missing
   `--spacing-root` would produce exactly that symptom — for ALL rhythm values
   equally, not differentially.

## 7. Verdict

**NOT REPRODUCED through the real build path.** On this tree, `ref sync` —
the same entry `@reference-ui/lib` builds through — emits every probe value
in both the `css()` object form and HQ's exact `<Div maxW="…">` JSX form:
unseen rhythm values `140r`/`137.5r` compute as `calc(N * var(--spacing-root))`,
the loose `rgba()` literal passes through verbatim, both controls emit, sync
exits 0 with zero diagnostics, and the generated runtime `css()` resolves all
seven probes to the exact classes the sheet carries. There is no emit-time
differential between "known" (`120r`, `200r`) and unseen (`140r`, `137.5r`)
values anywhere in this pipeline, consistent with the rhythm resolver being
generic `f64` math with no scale table. If the closed-scale symptom was seen
elsewhere (frozen legacy core, Book dev-server state, or a stale `.reference-ui`
folder), that path needs its own repro with the observation's exact location;
recommend the next crew re-check the original sighting against a fresh
`ref sync` and confirm whether `--spacing-root` was defined where nothing
painted.
