# Package scripts

Build tooling for the published JS bundle. `build-bundle.mjs` runs esbuild over the twelve published entries (ESM-only, React external, no splitting), stages each output, and only then swaps it into place, so a failed build never leaves a half-empty distribution tree. After the swap it writes `dist/bundle.inputs.json`, a digest of every file esbuild read and every output it wrote; `bundle-stamp.mjs` holds that format and the check that re-hashes those files, which the test runner uses to refuse a stale dist without running esbuild.
