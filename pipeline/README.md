# Reference UI Dagger Pipeline

This directory holds the first Dagger-based downstream smoke test for Reference UI.

The initial pipeline does not publish anything to the npm registry. Instead, it:

- uses local package contents from this repository
- packs publish-style tarballs for internal `@reference-ui/*` packages
- installs those tarballs into a fresh consumer project inside a container
- runs `ref sync` there to reproduce downstream packaging issues in isolation

## Prerequisites

- local setup completed via `pnpm setup:local` on macOS

## Local setup

For macOS development, run this once from the repository root:

```sh
pnpm setup:local
```

That bootstrap step lives under `pipeline/setup/` and currently handles:

- checking for Xcode Command Line Tools
- installing `dagger`
- installing `colima`
- installing the Docker CLI
- starting `colima` if it is not already running

To inspect the commands without executing them:

```sh
pnpm setup:local -- --dry-run
```

## Usage

From the repository root:

```sh
pnpm pipeline:downstream:smoke
```

Or from this directory:

```sh
pnpm run downstream:smoke
```

## Current scope

This first pass assumes the repo already has current build outputs for the packed packages. It is intentionally focused on the downstream install and `ref sync` path first.

The next step after this smoke path is to move the upstream package builds themselves fully inside the Dagger pipeline.