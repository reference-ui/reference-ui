# Sync

Regenerates the generated folder from config plus fragments. Serial by construction — fragments, one native compile, publish — a function of the project root, resolved once on entry so every spelling of it syncs alike.

The pass assembles into a stage nested inside the live folder, checks includes for patterns matching nothing and globs reaching dangling links, then commits with no missing-file window: identical bytes keep their mtime, changed files link into place over journaled backups, stale entries retire last. A failed commit rolls back to the last-good folder; readers always see complete files, which is what makes the folder bundler-friendly with no plugin.

One process owns a project through an atomic lock-dir claim. A second one-shot pokes a resident watch and waits until a resync covers it, or retakes a dead lock; an attached watch client holds no lock and does no work. Test-only pause points and a live child-process harness prove the races for real.
