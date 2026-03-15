# Reference UI

Knowledge-first UI component library.

## Status

🚧 **Scaffolding Phase** - Project structure initialized, implementations pending.

## Monorepo Structure

```
reference-ui/
├── packages/
│   ├── reference-core/      # Design system core package and generated pipeline
│   ├── reference-lib/       # First-party design system built on reference-core
│   ├── reference-unit/       # App dogfood bed for the generated runtime
│   ├── reference-docs/      # Documentation site using the CLI
│   └── reference-e2e/      # End-to-end/system composition testbed
```

## Tech Stack

- **Nx** - Monorepo tooling
- **Stencil.js** - Web components
- **React** - Framework bindings
- **Storybook** - Component documentation
- **pnpm** - Package manager

## Next Steps

See `packages/reference-core/ROADMAP.md` for the active platform roadmap.
