# Packages

The publishable units of the Reference UI monorepo.

Core is the TypeScript half of the compiler: authors write real TypeScript fragments, Core collects them into a spec, and Rust compiles that spec into a living system. It owns fragments, publish, and runtime above the cut, verified case by case.

Lib is the foundational design system: accessible compound components plus the base system downstream configs extend. Its barrel ships every component; its theme entry ships the design payload.

Icons generates one React component per Material Symbols slug with outline and filled variants and token-aware sizing, built over the shared icon factory.

MCP is the project-aware Model Context Protocol server for Reference UI workspaces: token-efficient tools that let coding assistants discover components, read tokens, and search icons.

Docs is the documentation site: a thin Vite, React, and TanStack Router shell around MDX articles with live component examples and build-time-highlighted source.

The Rust workspace holds the compiler crates and the single N-API native addon, reached through a shared runtime loader and typed TypeScript siblings.
