# Consumer smoke gate (W-31)

Packs the lib exactly as published, scaffolds a bare Vite + React consumer in
a temp dir (no workspace aliases, no tribal setup), and proves the artifact:

1. `check:dist` — refuses to smoke a stale `dist/` (B-11 process half).
2. `pnpm pack` — the real tarball, not a source link.
3. `tsc --noEmit` in the scaffold — the exports map (incl. `./primitives`
   types and `./styles.css`) resolves for a real consumer (B-13). A second
   pass (`tsconfig.lib-types.json`: `skipLibCheck: false`, `types: []`) must
   be clean for lib's own declarations and the app, which is what a consumer
   with `skipLibCheck: false` sees. Errors under `@reference-ui/icons` are
   counted and named, not gated, until icons ships self-contained types.
4. `vite build` + warning scan — zero node-builtin/externalized warnings
   (B-35 regression).
5. `vite dev` + Playwright probe — mounts every barrel component, runs the
   six B-11 behavioral assertions against current `src`, asserts zero
   unexpected console errors and zero `no compiled class` warnings.
6. Layered override through a real `ref sync` (`layers-probe.mjs`). The
   scaffold's `ui.config.ts` layers `extendSystem(libBaseSystem, { tokens })`,
   overriding `ui.button.default.background` (the token lib's default `<Button>`
   paints) with a light and a dark value. The served sheet must print the
   override under `[data-layer="reference-ui"]`, light and dark. A control sheet,
   the same base layered with no override, must print lib's defaults and no
   override value. Then a lib `Button` is painted on three pages (the override
   sheet, the control sheet, and lib's own `styles.css`): computed
   `background-color` in light and dark, the `data-layer="reference-ui"` stamp,
   and zero console errors. This proof lives here because a Neo case world cannot
   host lib: `@reference-ui/lib` is not linked into `packages/reference-neo`, and
   Neo never touches reference-lib.

Run locally (from anywhere in the repo):

```bash
pnpm --dir packages/reference-lib run smoke            # full gate
node packages/reference-lib/scripts/consumer-smoke/run.mjs --keep   # keep scaffold
```

The gate intentionally fails on B-03 `element.ref` noise (W-31 acceptance) —
those errors are counted under a separate `b03` bucket so the verdict names
the owner. The B-11 degenerate Splitter diagnostic (`[Reference UI Splitter]`)
is allowlisted only after a positive assertion that the fail-fast path fired.
The B-11 Presence check tolerates the open B-01 exit wedge (it asserts
recovery on re-show, never removal on hide).
