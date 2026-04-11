# Vite Integration

This folder contains the internal pieces behind `referenceVite()`, the Vite plugin used to make `ref sync --watch` feel native in development.

The split is intentionally small and explicit:

- `plugin.ts`: high-level orchestration. Wires Vite hooks to sync-session readiness.
- `constants.ts`: shared package ids and generated output roots.
- `project-paths.ts`: resolves project root, outDir, and managed output roots together.
- `managed-writes.ts`: buffers generated file writes until the next ready edge.
- `sync-session.ts`: watches the Reference sync session and notifies on ready transitions.
- `optimize.ts`: `optimizeDeps.exclude` merging for generated packages.
- `outputs.ts`: path classification for generated `.reference-ui` outputs.
- `hot-updates.ts`: conversion from buffered file writes to one Vite hot-update payload.
- `types.ts`: local type surface for the integration.
- `plugin.test.ts`: focused behavior tests for config merging and HMR batching.

Conceptually there are two overlapping but distinct boundaries:

- Managed packages: importable package ids like `@reference-ui/react` that should stay out of Vite's dependency optimizer.
- Generated output roots: directories inside `.reference-ui/` whose raw writes should not trigger immediate HMR handling while `ref sync` is still mid-cycle.

That distinction keeps package resolution concerns separate from watch/HMR coordination.