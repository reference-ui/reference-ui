# Package scripts

Build tooling for the published JS bundle. `build-bundle.mjs` runs esbuild over the twelve published entries (ESM-only, React external, no splitting), stages each output, and only then swaps it into place, so a failed build never leaves a half-empty distribution tree.
