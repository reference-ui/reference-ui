# Reference UI MCP

`@reference-ui/mcp` provides project-aware Model Context Protocol (MCP) intelligence for Reference UI workspaces. It exposes high-signal, token-efficient tools for AI coding assistants to discover, inspect, and style components, access design tokens, and search icons.

For complete tool input schemas, output contracts, and architecture internals, see **[tools.md](./tools.md)**.
For AI agent instructions and guiding principles, see **[instructions.md](./instructions.md)**.

---

## 3 Customization Tiers (`ui.config.ts`)

Reference UI projects configure their component and asset surface via boolean flags in `ui.config.ts`:

1. **Level 1: Primitives (`@reference-ui/react`)** (Always Enabled):
   - Mirror standard HTML elements 1:1 (`Div`, `Span`, `Button`, `Section`, `H1`–`H6`).
   - Driven entirely by type-safe, token-aware StyleProps.
2. **Level 2: Reference Library (`@reference-ui/lib`)** (`use_reference_library`, default: `true`):
   - 24 compound, accessible components (`Accordion`, `Tabs`, `Splitter`, `Menu`, `Popover`, `Switch`, etc.).
   - When set to `false`, excluded from `list_components` and guarded with clear notices in `get_component`.
3. **Level 3: Reference Icons (`@reference-ui/icons`)** (`use_reference_icons`, default: `true`):
   - Over 2,500 Material Symbols React icon components.
   - When set to `false`, `list_icons` notifies that Reference Icons are disabled.

---

## Tool Surface

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

---

## Architecture

- **`src/child-process/`**: Sandboxed worker pool executing Atlas AST analysis and model builds out-of-process.
- **`src/pipeline/`**: Data model extraction, library/icon catalogs, AST enrichment, and query engines.
- **`src/server/`**: MCP protocol server, active project tracking, model state caching, and universal fallback mode.
- **`src/cli/`**: CLI command bindings for stdio and HTTP/SSE transports (`ref mcp`).

---

## Running MCP

Run `pnpm exec ref sync` once after installation or package updates before starting the MCP server:

```shell
# Stdio transport (for IDEs and AI agent configs):
pnpm exec ref mcp

# HTTP/SSE transport:
pnpm exec ref mcp --http --port 3000
```

