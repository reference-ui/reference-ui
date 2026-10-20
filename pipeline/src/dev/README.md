# Dev workspace orchestration

Publishes release tarballs to the staged registry and verifies them from a container, then materializes a registry-backed package tree with packed deps, installs, starts the dev script, and opens a browser. Selected generated caches survive between runs so dev loops never re-install or re-generate from scratch.
