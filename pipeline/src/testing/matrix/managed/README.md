# Managed Matrix Config

This folder contains the pipeline-owned generated config shapes for matrix execution.

- `package-json/` owns managed fixture and synthetic consumer package manifests
- `bundlers/` owns managed bundler config files and bundler-owned dependency versions
- `playwright/` owns the shared matrix Playwright config shape for standard fixtures and generated consumers
- `react/` owns managed React runtime versions and generated browser mount entrypoints
- `tsconfig/` owns the synthetic consumer TypeScript config
- `vitest/` owns the shared matrix Vitest config shape for standard fixtures and generated consumers

The goal is to keep generated config contracts isolated from orchestration code.
