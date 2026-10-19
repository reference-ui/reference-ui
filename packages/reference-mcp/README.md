# Reference UI MCP

`@reference-ui/mcp` is project-aware Model Context Protocol intelligence for Reference UI workspaces: token-efficient tools for AI coding assistants to discover, inspect, and style components, read design tokens, and search icons.

Tool input schemas and output contracts: [tools.md](./tools.md). Agent instructions: [instructions.md](./instructions.md).

## Customization tiers (`ui.config.ts`)

Projects shape their component and asset surface with boolean flags in `ui.config.ts` (the snake_case spellings `use_reference_library` and `use_reference_icons` also work):

1. **Primitives (`@reference-ui/react`)**, always enabled: standard HTML elements 1:1 (`Div`, `Span`, `Button`, `Section`, `H1`–`H6`), driven by token-aware style props.
2. **Reference library (`@reference-ui/lib`)**, `useReferenceLibrary` (default `true`): 27 compound, accessible components. When `false`, they are excluded from `list_components` and guarded with clear notices in `get_component`.
3. **Reference icons (`@reference-ui/icons`)**, `useReferenceIcons` (default `true`): 3,800+ Material Symbols React icon components. When `false`, `list_icons` reports that Reference Icons are disabled.

## Tools

| Tool | Purpose |
| :--- | :--- |
| `list_projects` | Discovers all Reference UI projects across the workspace and user machine registry. |
| `select_project` | Sets the active project for the session and initiates background AST warmup. |
| `list_components` | Compact discovery of custom components and JSX-observed primitives (avoids HTML token spam). |
| `get_component` | High-signal summary of one component (props, examples, co-usage, StyleProps). |
| `get_component_props` | Full TypeScript prop signatures, types, defaults, and descriptions. |
| `get_component_examples` | Real JSX usage examples captured from the codebase. |
| `get_style_props` | Shared StyleProps categories, rhythm rules (`'1r'`), and container queries guide. |
| `get_tokens` | Project token paths, categories, and values (compressed for large token graphs). |
| `list_icons` | Searches `@reference-ui/icons` by name with import statements and usage snippets. |

## Running

Run `ref sync` once after installation or package updates, then start the server. It runs in the CLI process (`ref-mcp`, stdio or HTTP) — not in the sync worker pool — with shared catalog and query helpers in `src/pipeline/`.

```shell
# Stdio transport (for IDEs and AI agent configs):
pnpm exec ref-mcp

# Streamable HTTP transport:
pnpm exec ref-mcp --http --port 3000
```

Part of [Reference UI](../../../README.md).
