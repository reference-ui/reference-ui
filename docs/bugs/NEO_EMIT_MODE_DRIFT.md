# Emitted fragment bundles are invocation-mode dependent

Status: filed 2026-10-07 (surfaced by the one-shot startup voyage R1; inert
today). Severity P3. Separate topic — not part of the R1 land.

Owner surface: `packages/reference-neo/src/lib/microbundle/**` (+
`src/collect/lib/bootstrap.ts`).

## Symptom

The emitted `system/baseSystem.mjs` payload (and every fragment bundle) is
**not byte-identical across invocation modes**: running neo from **source**
(`bin/ref.ts` → `src/index.ts`, Node type-stripping) vs from **dist**
(`dist/bin/ref.js` → `dist/src/index.ts`) changes the emitted bytes.

## Mechanism

- `packages/reference-neo/src/collect/lib/bootstrap.ts:23-26` resolves the
  fragment-bundle alias entries from `import.meta.url`, so a source-invoked neo
  resolves aliases to `src/**` while a dist-invoked neo resolves them to
  `dist/src/**`.
- esbuild annotates each bundled module with a `// <path>` banner comment.
- The banner text propagates verbatim by string concatenation
  (`src/system/base/fragments.ts:6-13`) into every downstream
  `baseSystem.mjs`, so the payload differs by comments only:
  `// ../reference-neo/src/collect/constants.ts` (source) vs
  `// packages/reference-neo/dist/src/collect/constants.js` (dist).

## Impact

- Comments only; the fragment is **executed, never hashed** (no `createHash`
  over fragment sources; fragment bundles carry no sourcemaps). Evaluated spec,
  manifest, and CSS are byte-identical across modes.
- Practical effect: byte-identity comparisons that mix modes (e.g. a pin
  captured through a source-mode self-sync vs a dist-mode harness sync) show a
  spurious diff. This is what R1 exposed.
- No consumer is affected: the shipped product only ever runs dist mode
  (`package.json` `bin: ./dist/bin/ref.js`).

## Suggested fix

Make fragment-bundle emission mode-independent at the single seam every bundle
flows through — `packages/reference-neo/src/lib/microbundle/build-options.ts`
(cf. `runner.ts:32`, `runner.ts:72-74`) — by either:
1. post-stripping esbuild module-annotation comment lines from the bundle, or
2. canonicalizing alias-target paths before bundling.

Alternative site: `bootstrap.ts` resolving aliases to a canonical entry
regardless of `import.meta.url`, but `build-options.ts` covers all present and
future alias producers.

## Bar

- Emitted `baseSystem.mjs` (and fragment bundles) byte-identical from source
  and dist invocation of the same tip.
- Evaluated spec / manifest / CSS unchanged.
- Neo suites + `agentneo q` green; no published-byte change for a single mode.

## Provenance

`reports/WAVE1.arc.md` W1-1; `reports/WAVE1.R1.md` §4. Voyage
`.agents/missions/voyage-one-shot/`.

## Correction (robustness voyage recon, 2026-10-07)

Wave 0 of `voyage-robustness` (`reports/WAVE0.recon.md`) falsified two claims in
this doc:

1. **"Comments only" is false.** Four emitted files drift by invocation mode,
   all four in the pin baseline: `system/baseSystem.mjs` (banners + one reflowed
   destructuring), `react/react.mjs` (different minified program),
   `react/react.mjs.map` (`sources`/`mappings` differ), and `types/types.mjs`
   (**different module graph** — `react/jsx-runtime` vs
   `react`/`createElement`; 2,202-line diff). Evaluated spec / manifest / CSS are
   still byte-identical, so the "no semantic consumer" conclusion for those
   holds — but the emitted runtime/types bytes are mode-dependent beyond
   comments.
2. **The suggested fix seam is insufficient.** `lib/microbundle/build-options.ts`
   comment-stripping cannot remove the reflow, the minified-identifier drift,
   the sourcemap `sources` paths, or the `types.mjs` graph difference. Root
   cause spans **four** `import.meta.url` seams:
   `collect/lib/bootstrap.ts:24-26`, `packager/react.ts:30-41`,
   `packager/reference-types.ts:23-25`, `config/bundle.ts:36-39` (last inert).

Real-world consequence: `packages/reference-lib/package.json` `sync`
(`node ../reference-neo/bin/ref.ts sync`, source mode) is what `build`/`prepack`
run, and it cannot reproduce the dist-mode pin — running it changes all four
pinned lib artifacts (`verify-pins` FAILs 8). Byte-identity requires
canonicalising resolution across all seams **or** canonicalising every emitted
bundle (comments + formatting + sourcemap), **or** unifying the workspace on one
mode. The strategy is open for the robustness voyage.
