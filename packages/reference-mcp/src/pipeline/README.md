# MCP pipeline

Per-project model build behind the tools.

Building takes a project root and emits the joined component model: Atlas analysis runs out of process, tasty manifests resolve component types, and the join merges observed components with reference data. Loading prefers the persisted artifact; prefetch warms the cache on project selection. Queries project the artifact into tool answers over the static library, primitive, token, style-prop, and icon catalogs, with manifest diagnostics folded into one-line warnings.
