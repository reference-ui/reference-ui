# Reference UI Agent Instructions & Guiding Principles

Reference UI is a knowledge-first component and design-system engine for React, featuring generated primitives, token-aware atomic styling, rhythm units, and container-query-first responsive design.

When developing in a Reference UI codebase, follow these core principles:

---

## 1. Core Guiding Principles

1. **No External CSS Frameworks or Utility Classes**:
   Do NOT use Tailwind CSS classes, inline `style={{ ... }}` objects, or arbitrary CSS class names. All styling is applied through type-safe, token-aware **StyleProps** directly on primitives and components.

2. **Primitives First**:
   Import layout and structural elements from `@reference-ui/react` rather than using raw HTML elements (`div`, `section`, `span`, `p`, etc.):
   ```tsx
   import { Div, Section, Main, H1, P, Button } from '@reference-ui/react'
   ```

3. **Rhythm Spacing Units (`'r'`)**:
   Always express padding, margins, gaps, widths, and radii using rhythm strings ending in `r`:
   - Valid: `padding="2r"`, `gap="1r"`, `borderRadius="0.5r"`
   - Avoid: `padding="16px"`, `padding={4}`, or raw rem units.
   - Reference: `1r` corresponds to the base rhythm unit of the design system.

4. **Container-Query-First Responsive Design**:
   Reference UI is container-query-first. **Never use viewport media queries** (`@media`, `md:`, `lg:`):
   - Declare `container` on a parent to establish an inline-size query context:
     ```tsx
     <Div
       container
       padding="2r"
       display="flex"
       flexDirection="column"
       r={{
         480: { flexDirection: 'row', gap: '2r' },
         768: { padding: '4r', gap: '3r' },
       }}
     >
       <Div>Content A</Div>
       <Div>Content B</Div>
     </Div>
     ```
   - For nested or scoped queries, name the container:
     ```tsx
     <Div container="sidebar">
       <Div container="sidebar" r={{ 300: { padding: '3r' } }}>
         Sidebar Content
       </Div>
     </Div>
     ```

5. **Token-Aware Colors and Typography**:
   Use semantic token names rather than hardcoded hex codes:
   ```tsx
   <P color="muted" fontSize="sm">Subtext</P>
   <Div backgroundColor="surface" borderColor="border">Card</Div>
   ```

---

## 2. Multi-Project Workspace Intelligence

In monorepos and multi-package workspaces, the Reference UI MCP server can target different subpackages dynamically:

- **Discover Projects**: Call `list_projects` to see all Reference UI projects in your workspace and global machine registry.
- **Switch Active Project**: Call `select_project({ path: 'packages/...' })` to switch the server's primary context.
- **Per-Query Project Targeting**: Pass `project: 'packages/...'` directly into any tool call without altering the active default:
  ```ts
  get_component({ name: 'Button', project: 'packages/reference-lib' })
  ```
- **Universal Mode**: If a workspace has no `ui.config.ts`, the server automatically operates in Universal Primitives mode, providing full documentation for all built-in primitives and StyleProps.

---

## 3. Recommended MCP Investigation Workflow

When building or modifying UI with Reference UI:

1. **Discover Components**:
   Call `list_components` to see which custom components and primitives are active in the project graph.
2. **Inspect Component Interfaces**:
   Call `get_component({ name: 'ComponentName' })` for overview and usage patterns, or `get_component_props({ name: 'ComponentName' })` for full TypeScript interfaces.
3. **Inspect StyleProps & Tokens**:
   - Call `get_style_props` to see all available StyleProps categories and token compatibilities.
   - Call `get_tokens` to inspect specific project design tokens (colors, font sizes, shadows).
4. **Inspect Captured Usage**:
   Call `get_component_examples({ name: 'ComponentName' })` to see real JSX examples from the project.
