# Panda config extension

## Two separate things

1. **panda/config** – This folder **defines** the functions that extend the Panda config. Code in `styled/` (and eventually elsewhere) imports and calls them. The first one is **`extendPandaConfig`**: it takes a partial Panda config and registers it so the CLI can merge it into the final config. Other functions (e.g. `keyframes`, `fontFace`, `tokens`) can be added here later; each does one kind of extension.

2. **Eval** (CLI; see `cli/eval/`) – A runtime execution layer. It has a **registry of function names** to look for (e.g. `extendPandaConfig`). It does **not** know what those functions do. It walks directories (for now only `src/styled`), finds files that call those names, loads and runs those files, and collects whatever the functions return or register. So: eval just “find and run”; the meaning of each function lives in panda/config.

## Goal

The Panda config is built from a base plus whatever **extendPandaConfig** (and future functions) add when their call sites are evaluated. Eval runs over the scanned dirs, executes the code that calls those functions, and gathers the results. The config builder then merges everything and runs Panda.

## Functions defined here (panda/config)

- **`extendPandaConfig(partial)`** – Takes a partial Panda config object. When called during eval, that partial is collected and later deep-merged into the base config. This is the first registered function in eval’s registry.

(Others to come: keyframes, fontFace, tokens, etc. Each will be defined in panda/config and registered by name in eval.)

## What eval needs from this folder

- **Export** the functions (e.g. `extendPandaConfig`) so that files under `styled/` can `import { extendPandaConfig } from '...'` and call them.
- Eval only needs the **names** to put in its registry; it doesn’t need to know how each function works. When eval runs a file, the file imports the real function from here and calls it; eval just runs the file and collects the result.

## What we need

- **panda/config** – Define and export `extendPandaConfig` (and later other extenders). Implement the “when called, register this partial config” behaviour so the CLI can collect it.
- **Eval** – Registry of names (starting with `extendPandaConfig`), scan only `src/styled` for now, run files that call those names, collect return/registered values.
- **Config builder** – Take base config + collected fragments, deep-merge, then run Panda (or write generated config).

## Open design bits

- **Evaluation boundary** – How we run the file (Node, VM, worker, bundler) and how we wire in the “collect” behaviour when `extendPandaConfig` is called.
- **Order** – Merge order when multiple files or multiple calls contribute.
- **Import path** – How `styled/` imports from panda/config (relative path, or re-export via styled/entry so there’s a single public API).
