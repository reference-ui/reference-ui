# CORE-WATCH-28 — a bare-specifier upstream that re-syncs through node_modules resyncs the downstream watch, linked or installed

Evidence: the config bundler (`normalizeConfigDependencyPaths`) and the watch matcher (`collapseRoots`). The
bundler inlines a published base system imported by bare specifier, and before this claim the inlined file was left out
of the config's watch dependencies. An upstream re-sync then wrote a file no watch was subscribed to. Two layouts make
the file's real path sit under a directory the watch cannot use: a linked upstream is outside the consumer, and an
installed one sits in the consumer's `node_modules`, where the project's own subscription ignores every event.

The spec runs two legs in one process. Each builds a temp consumer whose config extends `core-watch-28-up/baseSystem`, an
upstream package that exports its real the published base system, and syncs both for real. The linked leg
symlinks the upstream into the consumer's `node_modules`, and the installed leg places it there as a real directory. Each
leg starts `watchSync()` on the consumer, re-syncs the upstream alone with a new ink, and requires a consumer resync whose
sheet carries the new ink and not the old one. Both temp trees are removed in a `finally`.

> Search terms: bare specifier, package specifier, node_modules, linked upstream, installed upstream, base system, inlined base system, watch dependency, upstream re-sync, downstream watch, parcel ignore, collapse roots, CORE-WATCH-28, CORE-LAYERS-06, CORE-LAYERS-15
