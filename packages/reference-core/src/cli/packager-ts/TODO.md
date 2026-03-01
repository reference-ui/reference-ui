# Packager-TS TODO

Remaining improvements for the TypeScript declaration packager.

---

## Inline tsdown Instead of Child Process

**Current**: Spawns `npx tsdown` via child process (`spawnMonitoredAsync` in compile/index.ts).

**Idea**: Run tsdown's CLI bin inline within our Node process—require/import it and invoke programmatically instead of spawning. Would avoid process spawn overhead and simplify error handling.

**Open**: Check if tsdown exposes a programmatic API or if we can `require('tsdown/cli')` and call its main with our args.

---

## Alignment with Packager Config

**Current**: Packager-ts hardcodes `node_modules/@reference-ui/*` for install paths. Packager has the same assumption today.

**Upcoming**: Packager will become config-aware (see packager/TODO.md)—custom output paths, symlinks on/off, etc. Packager-ts installs types *into* the packages packager already created. If packager writes to `.reference-ui/` + symlinks, or to a custom `dist/`, packager-ts needs to write types to the same location.

**Options**:

- **Shared path logic** — Extract "where does package X go?" into a shared module both use. Packager and packager-ts both read config and compute paths the same way.
- **Communication** — Packager emits install locations (e.g. in `packager:complete` payload); packager-ts consumes that. Tighter coupling but single source of truth.
- **Config-only** — Both read `ReferenceUIConfig` and independently compute paths. Must keep logic in sync.

**Recommendation**: Shared path logic. When packager implements config-aware install, factor out the path-resolution logic so packager-ts can reuse it. Then packager-ts stays in sync without events or payloads.
