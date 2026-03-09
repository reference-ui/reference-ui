# Reference UI

Knowledge-first UI component library.

## Status

🚧 **Scaffolding Phase** - Project structure initialized, implementations pending.

## Monorepo Structure

```
reference-ui/
├── packages/
│   ├── reference-cli/       # Design system CLI and generated package pipeline
│   ├── reference-lib/       # First-party design system built on reference-cli
│   ├── reference-app/       # App dogfood bed for the generated runtime
│   ├── reference-docs/      # Documentation site using the CLI
│   └── reference-test/      # End-to-end/system composition testbed
```

## Tech Stack

- **Nx** - Monorepo tooling
- **Stencil.js** - Web components
- **React** - Framework bindings
- **Storybook** - Component documentation
- **pnpm** - Package manager

## Next Steps

See `packages/reference-cli/ROADMAP.md` for the active platform roadmap.
