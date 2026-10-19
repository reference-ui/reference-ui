# Matrix Node Modules Cache

Cache policy for the matrix consumer install step: keep entries isolated at the dependency-graph level without a full `pnpm install` relink on every container run.

Two reuse layers:

- pnpm store cache, shared while the staged registry manifest fingerprint matches; invalidates when packed internal tarball hashes change.
- consumer `node_modules` cache, shared only for an identical effective install graph: staged internal versions, dependency lists, Node image, pnpm version, and React runtime. Fixture sources are excluded so code edits never trigger reinstalls.

Fixture-local volumes warm from a graph-shared seed copy on a cold cache. Keeping the policy here lets the Dagger runner orchestrate without hiding cache rules inline.

Parent: [matrix/README.md](../README.md).
