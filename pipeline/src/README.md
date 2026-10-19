# Pipeline Source

Execution graph for build, test, and release. `cli.ts` is the `pnpm pipeline` command tree; each subfolder owns one stage and hands artifacts to the next through the pipeline-local registry.

## Boundaries

- `build/` creates artifacts and pushes them into the local registry. Nothing else builds artifacts for the first time.
- `registry/` stores and serves packed tarballs plus a manifest; testing and release consume from it.
- `testing/` owns containerized test environments and orchestration. Test files, fixtures, and assertions stay in the packages under test.
- `release/` gates promotion from the local registry to npm. Changesets authors intent (`pnpm changeset`); the pipeline executes versioning, staging, and publish.
- `dev/` materializes registry-backed local dev workspaces; `clean/` wipes pipeline-managed state; `lib/` holds shared terminal and runtime helpers.

Commands outside `pnpm pipeline` are thin aliases or helpers: `pnpm release`, `pnpm setup:local`, and small conditional wrappers under `pipeline/scripts/`.

Parent: [pipeline/README.md](../README.md).
