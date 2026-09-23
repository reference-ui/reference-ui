# Bugs

Open issues found in agent/MCP first-touch and Neo runtime work.

The engine swap has landed (`reference-core` retired): the panda-era
core-debt audit (`JANK.md`) was deleted 2026-09-23 after verifying
every row pointed at the removed tree with no carryover. The bugs
below are independent of the compiler.

## MCP

| File | Scope | Issue |
| --- | --- | --- |
| [MCP_DEFAULT_PROJECT.md](./MCP_DEFAULT_PROJECT.md) | MCP | Default active project has no artifacts |
| [MCP_SELECT_PROJECT_SCHEMA.md](./MCP_SELECT_PROJECT_SCHEMA.md) | MCP | `select_project` rejects `project` |

## Atlas / inventory

| File | Scope | Issue |
| --- | --- | --- |
| [ATLAS_NON_IDENTIFIER_PROPS.md](./ATLAS_NON_IDENTIFIER_PROPS.md) | RS Atlas via MCP | `}` leaked as a prop name |
| [ATLAS_DISABLED_STYLEPROP.md](./ATLAS_DISABLED_STYLEPROP.md) | RS Atlas via MCP | `disabled` classified as a style prop |
| [ATLAS_USEDWITH_BLOAT.md](./ATLAS_USEDWITH_BLOAT.md) | RS Atlas via MCP | `usedWith` HTML-tag noise and inverted frequencies |

## Neo recipe runtime

| File | Scope | Issue |
| --- | --- | --- |
| [RECIPE_CLASSNAME_REQUIRED.md](./RECIPE_CLASSNAME_REQUIRED.md) | NEO recipe + RS extractor | Should `RecipeConfig.className` be required? (open investigation) |
