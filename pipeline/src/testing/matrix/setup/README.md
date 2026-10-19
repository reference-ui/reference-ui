# Matrix Setup

Materializes the pipeline-managed files of each matrix fixture: manifests plus generated runtime files such as bundler config, the HTML shell, and the React browser entrypoint. Optionally installs workspace dependencies and runs each package's sync script for IDE-ready local usage.

```sh
pnpm pipeline setup --sync                              # all matrix packages
pnpm pipeline setup --sync --packages=@matrix/playwright # targeted
pnpm pipeline setup --no-install                        # generate files only
```

The same step runs inside pipeline-managed environment creation before isolated test runs.

Parent: [matrix/README.md](../README.md).
