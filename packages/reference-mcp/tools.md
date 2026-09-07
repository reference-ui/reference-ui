# Reference UI MCP Tools & Architecture Reference

This document provides a complete technical rundown of the `@reference-ui/mcp` package structure, execution lifecycle, and tool specifications.

---

## Architecture Overview

```
packages/reference-mcp/
├── instructions.md                  # Contextual system prompt for connected AI agents
├── tools.md                         # This reference specification
├── README.md                        # Package overview & developer quickstart
├── src/
│   ├── index.ts                     # Public API barrel (server factory, types, tools)
│   ├── cli/                         # CLI entry points (`ref mcp` stdio/http transports)
│   │   ├── command.ts
│   │   └── index.ts
│   ├── child-process/               # Isolated worker pool for AST parsing & model building
│   │   ├── entry.ts                 # Worker script entry point (spawned by server)
│   │   └── process.ts               # Spawn & IPC supervisor
│   ├── pipeline/                    # Model indexing, joining, catalogs & queries
│   │   ├── artifact.ts              # Reads & writes .reference-ui/mcp/model.json
│   │   ├── build.ts                 # Enriches Atlas AST with tasty types & token maps
│   │   ├── library-catalog.ts       # 24 @reference-ui/lib component specs & examples
│   │   ├── icons-catalog.ts         # 2,500+ @reference-ui/icons search index
│   │   ├── primitives.ts            # Built-in @reference-ui/react HTML primitives catalog
│   │   ├── primitive-usage.ts       # Observes which primitives are actually used in JSX
│   │   ├── style-props.ts           # Token category mappings & StyleProps guide
│   │   ├── tokens.ts                # Token tree collector and compression
│   │   ├── queries.ts               # Component & token lookup engine
│   │   └── types.ts                 # MCP data schemas & artifact interfaces
│   └── server/                      # MCP protocol layer & project orchestration
│       ├── server-factory.ts        # McpServer instantiation & registration
│       ├── tools.ts                 # Tool definitions and input/output handlers
│       ├── resources.ts             # MCP resource providers
│       ├── project-manager.ts       # Multi-project session & active project state
│       ├── workspace-discovery.ts   # Auto-detects ui.config.ts in workspace & machine registry
│       ├── project-context.ts       # executeWithProject wrapper (warmup, timeouts, notices)
│       ├── model-state.ts           # Artifact caching, background refresh & deferred readiness
│       ├── universal-primitives.ts  # Fallback mode when no ui.config.ts is detected
│       └── instructions.ts          # Discovers and serves instructions.md to agents
```

---

## Customization Levels & Configuration Flags

Reference UI codebases configure their component and asset tiers in `ui.config.ts`:

| Level | Layer | Source Package | Config Flag | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | **Primitives** | `@reference-ui/react` | *Always enabled* | `true` | Capitalized HTML elements (`Div`, `Span`, `Button`, `Section`, `H1`–`H6`) driven by StyleProps. |
| **Level 2** | **Library Components** | `@reference-ui/lib` | `use_reference_library` (or `useReferenceLibrary`) | `true` | 24 compound accessible components (`Accordion`, `Tabs`, `Splitter`, `Menu`, `Popover`, `Switch`, etc.). |
| **Level 3** | **Icons** | `@reference-ui/icons` | `use_reference_icons` (or `useReferenceIcons`) | `true` | 2,500+ Material Symbols React icon components. |

---

## Complete Tools Reference

### 1. Project Management & Workspace Discovery

#### `list_projects`
Discovers all Reference UI projects in the current workspace, the global user machine registry (`~/.reference-ui/projects.json`), or an optional scan path. Automatically self-heals stale directory entries.
- **Inputs**:
  - `scanPath` *(string, optional)*: Directory path to scan (e.g. `'~/Developer'`).
  - `maxDepth` *(number, optional, default: 3)*: Traversal depth for discovery.
- **Output**:
  ```json
  {
    "activeProject": "/path/to/active/project",
    "projects": [
      {
        "path": "/path/to/project",
        "configPath": "/path/to/project/ui.config.ts",
        "source": "workspace",
        "hasArtifacts": true,
        "isDefault": true
      }
    ],
    "sanitizedStaleCount": 0
  }
  ```

#### `select_project`
Sets the active project for the current MCP session and immediately triggers background warmup of its Atlas AST and model artifacts.
- **Inputs**:
  - `path` *(string, required)*: Relative or absolute filesystem path to the project directory.
- **Output**:
  ```json
  {
    "status": "active",
    "project": "/path/to/project",
    "configPath": "/path/to/project/ui.config.ts",
    "atlasStatus": "ready",
    "componentsCount": 42
  }
  ```

---

### 2. Component Discovery & Inspection

#### `list_components`
Lists components observed in the project graph, including imported Reference UI primitives that are actually used in JSX. Does not dump unused standard HTML primitives to prevent token bloat.
- **Inputs**:
  - `project` *(string, optional)*: Target project override for monorepo pivots.
  - `query` *(string, optional)*: Search filter matching component name, source, or interface name.
  - `source` *(string, optional)*: Filter by source module (e.g. `'./src/components/Button.tsx'`).
  - `limit` *(number, optional, max: 100, default: 25)*: Pagination limit.
- **Config Reaction**:
  - If `use_reference_library: false`, components from `@reference-ui/lib` are filtered out of the returned listing.
- **Output**:
  ```json
  {
    "components": [
      {
        "name": "HeroBanner",
        "kind": "project",
        "source": "./src/components/HeroBanner.tsx",
        "usage": "very common",
        "count": 12,
        "usageSemantics": { ... },
        "interfaceName": "HeroBannerProps",
        "propCount": 5,
        "observedProps": ["heading", "ctaHref"],
        "styleProps": { "supported": true, "tool": "get_style_props" }
      }
    ]
  }
  ```

#### `get_component`
Returns a compact, high-signal model for one component, including observed usage counts, co-occurring components (`usedWith`), code examples, and StyleProps support.
- **Inputs**:
  - `name` *(string, required)*: Name of the component (e.g. `'Accordion'`, `'Button'`).
  - `source` *(string, optional)*: Explicit source module if multiple components share the same name.
  - `project` *(string, optional)*: Target project directory.
- **Config Reaction**:
  - If `use_reference_library: false` and the component originates from `@reference-ui/lib` without a local override, returns:
    ```
    Component 'Accordion' is part of @reference-ui/lib, but 'use_reference_library' is disabled in ui.config.
    ```
  - If `use_reference_library: true`, falls back to the built-in catalog for `@reference-ui/lib` components even if they haven't been observed yet in JSX.
- **Output**:
  ```json
  {
    "name": "Accordion",
    "kind": "component",
    "source": "@reference-ui/lib",
    "count": 0,
    "usage": "unused",
    "examples": ["<Accordion type=\"single\" collapsible>..."],
    "interface": { "name": "AccordionProps", "source": "@reference-ui/lib" },
    "props": [ ... ],
    "propSummary": { "total": 6, "observed": 0, "documented": 6, "style": 0, "returned": 6 },
    "styleProps": { "supported": false }
  }
  ```

#### `get_component_props`
Returns full TypeScript prop signatures, types, default values, and descriptions for a component.
- **Inputs**:
  - `name` *(string, required)*: Component name.
  - `source` *(string, optional)*: Explicit source module.
  - `includeUnused` *(boolean, optional, default: true)*: Include documented props that have not yet been observed in JSX.
  - `includeStyleProps` *(boolean, optional, default: true)*: Include inherited atomic StyleProps.
  - `query` *(string, optional)*: Filter props by name or description.
  - `limit` *(number, optional, max: 500)*: Max props to return.
  - `project` *(string, optional)*: Target project directory.
- **Config Reaction**:
  - Enforces `use_reference_library: false` check identically to `get_component`.

#### `get_component_examples`
Returns captured JSX examples showing real-world project usage patterns.
- **Inputs**:
  - `name` *(string, required)*: Component name.
  - `source` *(string, optional)*: Explicit source module.
  - `project` *(string, optional)*: Target project directory.
- **Config Reaction**:
  - Enforces `use_reference_library: false` check identically to `get_component`.

---

### 3. Styling, Tokens & Icons

#### `get_style_props`
Returns the global Reference UI StyleProps documentation, showing camelCased atomic props, rhythm unit rules (`'1r'`, `'2r'`), container query syntax (`r={{ ... }}`), and token category compatibility.
- **Inputs**:
  - `query` *(string, optional)*: Search filter for specific style prop names or categories.
  - `includeProps` *(boolean, optional)*: Return the exhaustive prop list.

#### `get_tokens`
Extracts design tokens declared in `ui.config.ts` and token fragment files. Automatically compresses large token sets to paths and categories to protect the agent's context window.
- **Inputs**:
  - `category` *(string, optional)*: Filter by token category (e.g. `'colors'`, `'spacing'`, `'radii'`).
  - `query` *(string, optional)*: Search token paths and descriptions.
  - `limit` *(number, optional, max: 1000)*: Max tokens to return.
  - `project` *(string, optional)*: Target project directory.

#### `list_icons`
Fast fuzzy search across 3,800+ `@reference-ui/icons` (Material Symbols React icon components). Supports single keywords, typos, natural language sentences, or explicit batch demands, returning token-minimal `{ name, description }` records.
- **Inputs**:
  - `query` *(string, optional)*: Search term, natural language sentence, or comma-separated icon needs (e.g. `'trash'`, `'gear'`, `'I need icons for user settings, shopping cart, and trash'`).
  - `demands` *(string[], optional)*: Explicit list of icon demands to search in batch in a single tool call (e.g. `['user profile', 'trash', 'settings']`).
  - `category` *(string, optional)*: Optional category filter (e.g. `'action'`, `'navigation'`, `'editor'`).
  - `limit` *(number, optional, max: 100, default: 25)*: Number of icons to return (or per demand).
  - `verbose` *(boolean, optional, default: false)*: Set to true to include import statements and JSX usage examples.
  - `project` *(string, optional)*: Target project directory.
- **Config Reaction**:
  - If `use_reference_icons: false`, returns a notice instead of icons:
    ```json
    {
      "enabled": false,
      "notice": "Reference Icons are disabled in ui.config (use_reference_icons: false). Use the project's custom icon system.",
      "total": 0,
      "returned": 0,
      "icons": []
    }
    ```
- **Normal Output (Single Query)**:
  ```json
  {
    "total": 14,
    "returned": 14,
    "icons": [
      {
        "name": "ArrowForwardIcon",
        "description": "Arrow Forward icon showing a rightward-pointing arrow. Used for advancing, next navigation, and forward progression."
      }
    ]
  }
  ```
- **Multi-Demand Output (Sentences or `demands` array)**:
  ```json
  {
    "totalDemands": 2,
    "demands": [
      {
        "demand": "shopping cart",
        "icons": [{ "name": "ShoppingCartIcon", "description": "..." }]
      },
      {
        "demand": "trash",
        "icons": [{ "name": "DeleteIcon", "description": "..." }]
      }
    ],
    "total": 2,
    "returned": 2,
    "icons": [
      { "name": "ShoppingCartIcon", "description": "..." },
      { "name": "DeleteIcon", "description": "..." }
    ]
  }
  ```

---

## Universal Primitives Mode

When the MCP server runs in a directory or workspace where no `ui.config.ts` exists:
1. The server **does not crash or error**.
2. It activates **Universal Primitives Mode**, serving:
   - Built-in `@reference-ui/react` layout and typography primitives (`Div`, `Span`, `Button`, `Section`, `H1`–`H6`, etc.).
   - Standard `@reference-ui/lib` components.
   - The shared `get_style_props` reference.
   - Informative notices guiding the developer to run `ref init` or `ref sync` to enable project-specific tokens and AST analysis.
