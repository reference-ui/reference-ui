# Packager TODO

Remaining improvements to finish off the packager. Not a roadmap—just what’s left to do.

---

## Config-aware Install

**Current**: `installPackages(coreDir, userProjectDir, packages)` — install has no access to `ReferenceUIConfig`.

**Need**: Pass config into install so it can adapt based on user settings. Examples:

- Config might specify a custom output path or scope
- Config could enable/disable symlinks per project
- Future: different packages for different config modes

**Approach**: Worker already has `config` in the payload. Pass it through to `installPackages` and have install use it when computing paths or deciding symlink behavior.

---

## Other Ideas (Lower Priority)

- **Source maps** — Add source maps for debugging
- **Package caching** — Skip rebuild when inputs unchanged
- **Proper .d.ts bundles** — Generate type declarations from bundled output

---

## Out of Scope

- **CLI self-bundling** — The CLI is built separately (e.g. build-cli.mjs). Self-bundling would create a chicken-egg problem; keep it as a distinct build step.
- **Shebang/chmod** — Only relevant for CLI executables; not needed for npm packages.
`