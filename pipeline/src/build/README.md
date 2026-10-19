# Build Pipeline

Builds the registry-target workspace packages and pushes the outputs into the pipeline-local registry. `pnpm pipeline build` builds, packs with scripts disabled (`npm_config_ignore_scripts`, so no rebuild during packaging), writes `.pipeline/registry/manifest.json`, and loads missing versions into managed Verdaccio.

Input-hash fingerprints skip unchanged packages between runs. Rust native packaging for `@reference-ui/rust` lives in [rust/](rust/) and follows the same rule: build here once, then stage the prepared artifacts through the registry.

Parent: the src index.
