# Mission brief — package-unify-1008

## Owner instruction (verbatim, 2026-10-08)

> "The TSUP dep thing is something to investigate. Ideally, we package up every
> reference lib in the same way as we do reference icons. You know, and look at
> reference neo, it's such a simple thing. Strip away everything, all the
> bullshit and all the old stuff with TSUP and all the dependency around it.
> It's an unmaintained library, so if we could avoid using it, that would be
> great."

## Objective

Unify how Reference packages are built and shipped: **drop `tsup`** and package
every lib the way `reference-icons` does, modelled on the simplicity of
`reference-neo`. Fewer moving parts, no unmaintained bundler.

## Recon (captain, HEAD ~`917203f18`)

| package | bundler | types | notes |
| --- | --- | --- | --- |
| `reference-lib` | **tsup@^8.5.1** | `tsc -p tsconfig.build.json` | `dist/index.mjs` + `dist/theme/index.mjs`; `clean: true`; externals react/react-dom/@reference-ui/react+styled; `noExternal: gsap`; then `scripts/build-package.mjs` |
| `reference-icons` | **rollup@^4.59** + `@rollup/plugin-node-resolve` + `rollup-plugin-esbuild` | `tsc -p tsconfig.build.json` | `scripts/build.mjs` orchestrates generate → ensure-dist → sync → `rollup -c` → tsc → materialize → assert |
| `reference-neo` | **esbuild@^0.28** (`tools/build-bin.mjs`, 148 lines) | `tsc` | the "simple thing" model |

Coupling to watch: `materialize-runtime.mjs` `bundleRewrites` + `build-package.mjs`
assume the tsup `dist` shape; `check-dist-fresh.mjs` references tsup; the consumer
smoke is the acceptance; the WAVE5 helper leak traces to **tsc**
(`rewriteRelativeImportExtensions`), not tsup — so dropping tsup alone may not
remove it, the WAVE5 postprocess fix does.

## Decomposition (proposed; Oracle to review at TSUP.oracle)

- **Arc 1 — plan.** Oracle design consult: target build shape, migration steps,
  coupling, risks, bar. (this brief's sibling)
- **Arc 2 — migrate `reference-lib`** off tsup (rollup like icons, or a small
  esbuild script like neo), preserving the `dist` shape the smoke/`bundleRewrites`
  assert; delete `tsup.config.ts` + the `tsup` dependency.
- **Arc 3 — census + migrate any remaining tsup users** (`grep tsup` across the
  workspace, incl. the mcp vendored seam if applicable).
- **Arc 4 — verify.** Consumer smoke, `pnpm --filter reference-docs build`,
  perf (docs spin-up + build wall time unchanged or better), pins.

## Constraints

Do not regress performance (docs spin-up / build times). One working tree —
implementers serialize. Do not touch the running docs dev server or the
concurrent `font-weight-runtime-1008` mission. Owner wants this *investigated*
first; landing is a follow-on.
