# Virtual FS

The `fs` module owns the source-shaped virtual mirror.

## Files

- `copy.ts`: single-file copy and unlink helpers used by watch mode and snapshot staging
- `staging.ts`: isolated snapshot staging area that publishes into the live virtual directory in one swap
- `sync-snapshot.ts`: cold-start/full-refresh orchestration that walks includes, stages files, syncs the style collection, and publishes the finished snapshot

## Naming

The full-refresh entrypoint is called `syncVirtualSnapshot()` rather than `copyAll()` because it does more than loop over files:

- builds the snapshot in a sibling staging directory
- emits source-shaped live paths while staging
- materializes the reserved Panda-visible style collection
- publishes the completed snapshot into the live virtual directory