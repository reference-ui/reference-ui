# Reference UI

Reference UI is a React component library with a typed design system. Its CSS is compiled at build time: `ref sync` reads your `ui.config.ts` and emits the stylesheet and the TypeScript types for your design tokens, so the components' style props accept your tokens.

## Packages

| Package | npm name | Purpose |
| --- | --- | --- |
| Component library | `@reference-ui/lib` | React components, layout and text primitives, and the compiled stylesheet |
| Icons | `@reference-ui/icons` | Material Symbols icons as React components |
| Native compiler | `@reference-ui/rust` | Rust compiler and N-API bindings used by `ref sync` |
| MCP server | `@reference-ui/mcp` | Gives AI coding assistants project-aware access to components, tokens and icons |
| `ref` CLI | — | `ref sync` compiles `ui.config.ts`; `ref sync --watch` keeps the output current |

## Quick start

1. Install the library. React 19 is a peer dependency, so your app supplies the one React copy.

   ```bash
   npm install @reference-ui/lib react react-dom
   ```

2. Create `ui.config.ts` at your app root. It extends the library's design system, so its tokens and types come into your project.

   ```ts
   // ui.config.ts
   import { defineConfig } from '@reference-ui/core'
   import { baseSystem } from '@reference-ui/lib/baseSystem'

   export default defineConfig({
     name: 'my-app',
     include: ['src/**/*.{ts,tsx}'],
     extends: [baseSystem],
   })
   ```

3. Run sync, and run it again after you install or upgrade `@reference-ui/lib`.

   ```bash
   ref sync
   ```

4. Import the stylesheet before your app code, then use a component.

   ```tsx
   // main.tsx
   import '@reference-ui/lib/styles.css'
   import { ReferenceLibrary } from '@reference-ui/lib'
   import { Button } from '@reference-ui/lib/primitives'

   // ReferenceLibrary mounts the toast host and live-region announcer.
   export function App() {
     return (
       <ReferenceLibrary>
         <Button variant="primary">Save</Button>
       </ReferenceLibrary>
     )
   }
   ```

To have lib's style props reject values outside your tokens, name the categories you want enforced (such as `colors`, `radii` and `spacing`) under `strict` in `ui.config.ts`. The [lib README](packages/reference-lib/README.md) covers the details.

## Documentation

The documentation site lives in [`packages/reference-docs`](packages/reference-docs/). After the one-time setup under [Development](#development), serve it locally with `pnpm dev:docs`, then open http://localhost:5174.

Package READMEs: [`@reference-ui/lib`](packages/reference-lib/README.md), [`@reference-ui/icons`](packages/reference-icons/README.md), [`@reference-ui/mcp`](packages/reference-mcp/README.md).

## Repository layout

- `packages/reference-lib`: `@reference-ui/lib`, the React component library
- `packages/reference-icons`: `@reference-ui/icons`, the icon package
- `packages/reference-rs`: `@reference-ui/rust`, the Rust compiler and native bindings
- `packages/reference-core`: the `ref` CLI and sync pipeline (private workspace package)
- `packages/reference-mcp`: `@reference-ui/mcp`, the MCP server
- `packages/reference-docs`: the documentation site (private workspace package)
- `matrix/`: consumer-style fixture projects and the kept matrix test suites
- `pipeline/`: the Dagger pipeline that builds the workspace and runs the matrix suites

## Development

You need Node 24, pnpm (`corepack enable` picks up the version the repository pins) and a Rust toolchain from [rustup](https://rustup.rs). `ref sync` runs on the native compiler in `packages/reference-rs`, and a checkout builds it from source.

```bash
pnpm install         # from the repository root
pnpm bootstrap       # build the native compiler, icons, the ref CLI and lib, then sync the docs
pnpm dev:lib         # ref sync --watch plus Book, the component playground, on http://localhost:5000
pnpm dev:docs        # documentation site on http://localhost:5174
pnpm test:lib        # library tests: Vitest, then Playwright component tests
pnpm test:rs         # Rust workspace tests and native binding tests
pnpm pipeline test   # matrix suites through the Dagger pipeline (needs Docker)
```

Run `pnpm bootstrap` once after cloning, and again after pulling changes to `packages/reference-rs` or `packages/reference-lib`: `ref sync` and the docs site read their built output, not their source.

## License

Reference UI is licensed under the [MIT License](LICENSE).
