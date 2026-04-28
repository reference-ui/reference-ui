# Managed Matrix Config

This folder contains the pipeline-owned generated config shapes for matrix execution.

- `package-json/` owns managed fixture and synthetic consumer package manifests
- `bundlers/` owns managed bundler config files and bundler-owned dependency versions
- `react/` owns managed React runtime versions and generated browser mount entrypoints
- `tsconfig/` owns the synthetic consumer TypeScript config

The goal is to keep generated config contracts isolated from orchestration code.
