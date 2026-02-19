# Eval

CLI-only component that **walks directories**, finds files that call a fixed set of function names (e.g. `extendPandaConfig`)

## Structure

- **`registry.ts`** – List of function names to scan for. Eval has no knowledge of what they do. First: `extendPandaConfig`.
- **`scanner.ts`** – Walks the given directories, finds `.ts`/`.tsx` files that contain any registered function name. Simple substring search for now.
- **`runner.ts`** – Runs each matched file via `bundle-n-require`, with a global collector set so that when the file calls `extendPandaConfig(partial)`, the partial is captured. Returns all collected fragments.

Call `runEval(coreDir, ['src/styled'])` (or any dirs) to scan and run; it returns `Partial<Config>[]`., and **evaluates** those call sites to get config fragments. It doesn’t just parse the AST—it runs the code (with deps) and collects what the functions return.

## Role

- **Input:** A list of directories to search, and a **registry** of function names we care about (each with a rule for how to merge its return value into the Panda config).
- **Output:** A set of config fragments (keyframes, tokens, partial config, etc.) that the rest of the CLI merges into the base Panda config.

## Pipeline

1. **Walk** – Traverse the given directories for relevant source files (e.g. `.ts`, `.tsx`).
2. **Discover** – Find call sites of the registered function names (e.g. via AST or static analysis).
3. **Evaluate** – For each file that contains such a call, load and run the module (with its dependencies) in a build-time context.
4. **Call** – Invoke the config-extending function and capture its return value (the config fragment).
5. **Collect** – Gather all fragments and pass them to the config builder.

So: “scan these dirs for these function names, then evaluate and call.”

## Relationship to the rest of the CLI

- **`extendPandaConfig`** is defined in `panda/config/`. Styled files import and call it. When eval runs those files, the call registers the partial config.
- **Eval** only knows the function names in the registry; it does not know how they work. It finds files, runs them, collects results.
- The **config builder** (see `panda/config/`) takes the base config plus eval’s output and produces the final Panda config.

## Implementation notes

- “Scanner” is deliberately avoided: we’re not only scanning, we’re evaluating. Eval does both discovery and execution.
- Evaluation strategy (VM, worker, bundler, sandbox) is still an open design choice; see `panda/config/readme.md`.
