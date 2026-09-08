# Reference UI Agent Instructions & Guiding Principles

Reference UI is a knowledge-first component and design-system engine for React, featuring generated primitives, token-aware atomic styling, rhythm units, and container-query-first responsive design.

When developing in a Reference UI codebase, follow these core principles:

---

## 1. Core Guiding Principles

1. **StyleProps are Compile-Time Atomic CSS Classes (No External CSS Frameworks)**:
   Reference UI uses a build-time static atomic CSS engine (Panda CSS). Every `StyleProp` (`padding="2r"`, `display="flex"`, `color="primary"`) is extracted from the AST at build time and compiled directly into atomic CSS utility classes. At runtime, components simply receive generated CSS class names—there is zero runtime CSS-in-JS injection overhead.
   - Do NOT use Tailwind CSS classes or arbitrary CSS class names.
   - All standard layout, typography, rhythm, and theme styling must be applied through type-safe, token-aware **StyleProps** directly on primitives and components.
   - Never use inline `style={{ ... }}` for static styling (colors, padding, layout).
   - Reserve inline `style={{ ... }}` strictly for arbitrary runtime-calculated values that exceed the limitations of build-time codegen (see Section 5).

2. **Primitives First (1:1 with HTML)**:
   Import layout and structural elements from `@reference-ui/react` rather than using raw HTML elements:
   ```tsx
   import { Div, Section, Main, H1, P, Button, Span, Input } from '@reference-ui/react'
   ```
   - **All HTML elements exist as PascalCase primitives** (`Div`, `Span`, `P`, `Button`, `Section`, `H1`–`H6`, `Table`, `Tr`, `Td`, etc.).
   - Do NOT query `list_components` to check if a standard HTML tag exists—assume all standard HTML elements are natively available as primitives.
   - Use `list_components` primarily to discover **custom project components** (e.g. `Menu`, `Dialog`, `Splitter`, `Tabs`) and observed usage in that project.

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

## 2. Dynamic Project Tracking in Monorepos

In monorepos and multi-package workspaces, the user will often pivot between different packages (e.g. `packages/reference-lib`, `packages/reference-docs`). Always track the package you are working in:

- **Set Session Focus**: When shifting your work to a package, call `select_project({ path: 'packages/...' })`. All subsequent tool calls will operate in that project's AST and token graph.
- **Per-Query Targeting**: If you just need a one-off query from another package without altering active focus, pass `project: 'packages/...'`:
  ```ts
  get_component({ name: 'Button', project: 'packages/reference-lib' })
  ```
- **Discover Projects**: Call `list_projects` to discover all Reference UI projects in your workspace and global machine registry.
- **Universal Mode**: If a workspace has no `ui.config.ts`, the server automatically operates in Universal Primitives mode, providing documentation for built-in primitives and StyleProps.

---

## 3. Levels of Customization & Config Flags

Reference UI codebases configure their component and asset tiers in `ui.config.ts`:

1. **Level 1: Primitives (`@reference-ui/react`)** (Always Enabled):
   - Fundamental layout and typography primitives (`Div`, `Span`, `Button`, `Section`, `H1`–`H6`, etc.) mirroring HTML elements 1:1.
   - Fully token-aware and driven by atomic StyleProps. Universal across all projects.

2. **Level 2: Reference Library (`@reference-ui/lib`)** (`use_reference_library`, default: `true`):
   - 24 official accessible compound components (`Accordion`, `Calendar`, `Collapsible`, `Combobox`, `DateField`, `Field`, `FocusLock`, `Listbox`, `Menu`, `NumberField`, `Overlay`, `Popover`, `Portal`, `Presence`, `ReferenceLibrary`, `RovingFocus`, `Slider`, `Slot`, `Splitter`, `Switch`, `Tabs`, `Toast`, `Tooltip`, `Tree`).
   - Configurable in `ui.config.ts` via `use_reference_library` (or camelCase `useReferenceLibrary`, boolean, defaults to `true`).
   - When set to `false`, `@reference-ui/lib` components are excluded from discovery, and MCP queries for them will inform you that the reference library is disabled for this project.

3. **Level 3: Reference Icons (`@reference-ui/icons`)** (`use_reference_icons`, default: `true`):
   - Over 3,800 Material Symbols React icon components (`SearchIcon`, `ArrowForwardIcon`, `CheckIcon`, `DeleteIcon`, etc.).
   - Searchable via the `list_icons` tool. Supports semantic search, typo tolerance, natural language sentences, and batch demand lists (e.g. `query: 'trash'`, `query: 'I need icons for user settings, cart, and trash'`, or `demands: ['cart', 'trash']`). Returns lean `{ name, description }` records to conserve tokens.
   - Sizing tokens: `size="sm"` (16px / `4r`), `size="md"` (20px / `5r`, default), `size="lg"` (24px / `6r`).
   - Color: inherits by default (`'inherit'`) or accepts theme token colors via StyleProps (`color="text"`, `color="primary"`, `color="muted"`).
   - Configurable in `ui.config.ts` via `use_reference_icons` (or camelCase `useReferenceIcons`, boolean, defaults to `true`).
   - When set to `false`, `list_icons` will inform you that Reference Icons are disabled and that the project uses its own custom icon system.

---

## 4. Recommended MCP Investigation Workflow

When building or modifying UI with Reference UI:

1. **Verify Your Target Project**:
   Ensure you are targeting the package relevant to the user's request (via `select_project` or `project: '...'`).
2. **Discover Custom Components**:
   Call `list_components` to see custom components and observed primitives in that project graph.
3. **Inspect Component Interfaces**:
   Call `get_component({ name: 'ComponentName' })` for overview and usage patterns, or `get_component_props({ name: 'ComponentName' })` for full TypeScript interfaces.
4. **Discover Icons**:
   Call `list_icons({ query: 'semantic-search-term' })` (e.g. `query: 'trash'`, `query: 'I need icons for user profile, cart, and trash'`, `demands: ['cart', 'settings']`, or `category: 'navigation'`) to discover icon components from `@reference-ui/icons`.
5. **Inspect StyleProps & Tokens**:
   - Call `get_style_props` to see all available StyleProps categories and token compatibilities.
   - Call `get_tokens` to inspect specific project design tokens (colors, font sizes, shadows).
6. **Inspect Captured Usage**:
   Call `get_component_examples({ name: 'ComponentName' })` to see real JSX examples from the project.

---

## 5. Build-Time Static Codegen vs. Runtime Styling (The "Fine Line")

Reference UI styling is powered by Panda CSS's **static AST extraction model**. Because styles are extracted and generated at compile-time rather than injected at runtime, understanding the boundary between **what codegen can extract** and **what it drops** is essential.

### The Mental Model: StyleProps ARE CSS Classes
When you write `<Div padding="2r" color="primary" />`, the compiler extracts `.p_2r` and `.c_primary` at build time. The primitive at runtime simply renders `<div class="p_2r c_primary">`. If a prop value cannot be determined statically at build time, **the compiler drops it entirely**, resulting in silent styling failures (e.g. `zIndex` falling back to `auto`, `opacity` or `transform` disappearing).

---

### The Fine Line: What Codegen CAN and CANNOT Extract

#### ✅ What Codegen CAN Extract (Allowed in StyleProps)
1. **Static Literals & Theme Tokens**:
   ```tsx
   <Div padding="2r" color="primary" zIndex="modal" />
   ```
2. **In-File Statically Resolvable Constants**:
   ```tsx
   const CARD_PAD = "3r"
   <Div padding={CARD_PAD} />
   ```
3. **Known Static Ternaries / Runtime Branch Conditions**:
   Panda analyzes both branches of conditional expressions and pre-generates CSS for both branches ahead of time. At runtime, React simply toggles between the two pre-compiled classes:
   ```tsx
   // ✅ Both "primary" and "muted" classes are pre-compiled into the stylesheet
   <Div color={isActive ? "primary" : "muted"} />
   
   // ✅ Both "flex" and "none" are pre-compiled
   <Div display={isOpen ? "flex" : "none"} />

   // ✅ Responsive branch conditions
   <Div padding={{ base: "1r", md: isExpanded ? "4r" : "2r" }} />
   ```
4. **Data Attributes & Pseudo-States**:
   State styling via data attributes and selectors is statically analyzable:
   ```tsx
   <Div _hover={{ color: "accent" }} _expanded={{ bg: "surface.raised" }} />
   ```

---

#### ❌ What Codegen CANNOT Extract (Compiler Drops Value)
1. **Dynamic Arithmetic & Runtime Calculations**:
   ```tsx
   // ❌ DROPPED: Compiler cannot evaluate runtime JavaScript arithmetic
   <Div zIndex={totalCount - offset} />
   <Div opacity={1 - dragOffset / 300} />
   <Div width={`${(progress / total) * 100}%`} />
   ```
2. **Computed / Dynamic Object Lookups**:
   ```tsx
   // ❌ DROPPED: Dynamic key lookup cannot be resolved at build time
   const colors = { active: 'primary', inactive: 'muted' }
   <Div color={colors[status]} />
   ```
3. **Values from External Files, Functions, or Generic Runtime Props**:
   ```tsx
   // ❌ DROPPED: Values outside file scope or function return values
   <Div color={computeColor(user)} />
   <Div size={props.dynamicSize} />
   ```

---

### The 3 Architectural Solutions for Dynamic Needs

When requirements cross the line into runtime dynamism, choose the appropriate pattern:

1. **Continuous / Calculated Values → Inline `style={{ ... }}`**:
   For coordinates, physics, drag gestures, stacking indices, or fluid percentages, bypass the static CSS engine and apply directly to the DOM:
   ```tsx
   // ✅ Correct: Bypasses static engine, guarantees DOM application
   <Div style={{ zIndex: totalCount - offset, opacity: 1 - dragOffset / 300 }} />
   ```

2. **Hybrid Static + Dynamic → CSS Custom Properties**:
   Keep layout and token properties in StyleProps, but drive numerical scales or offsets via CSS variables in inline `style`:
   ```tsx
   // ✅ Correct: CSS variable injected via style, consumed statically
   <Div
     style={{ '--card-offset': `${index * 8}px` } as React.CSSProperties}
     transform="translateY(var(--card-offset))"
   />
   ```

3. **Discrete Variants → Static Ternaries or Data Attributes**:
   If the dynamic need only has 2–4 discrete options, avoid calculations entirely and use explicit token ternaries or `data-*` attributes:
   ```tsx
   // ✅ Correct: 2 known branches, fully extracted
   <Div opacity={isDimmed ? 0.4 : 1} />
   ```
