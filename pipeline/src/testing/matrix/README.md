# Matrix Testing

Runs each matrix package in isolated Dagger containers across its declared React × bundler combinations. Packages are discovered from the matrix suite tree ([discovery/](discovery/)), their managed files generated ([setup/](setup/), [managed/](managed/)), then installed and tested per entry ([runner/](runner/)) with cached `node_modules` hydration ([node-modules/](node-modules/)).

## Commands

```sh
pnpm pipeline test                                        # every package, default environment
pnpm pipeline test --packages=@matrix/chain-t8 --react=react19 # subset / pinned runtime
pnpm pipeline test --full                                 # every declared React × bundler
pnpm pipeline test --trace                                # stream the Dagger execution trace
```

Matrix runs fail fast when Docker/Colima lacks the configured CPU, memory, or free disk (see `MATRIX_CONFIG` in the pipeline config). On macOS, Colima starts automatically when the active Docker context is `colima` but the VM is down. Logs and artifacts land under `.pipeline/testing/matrix`.

Parent: the testing index.
