# Matrix Setup

Materializes the pipeline-managed files of each matrix fixture: manifests plus generated runtime files such as bundler config, the HTML shell, and the React browser entrypoint. Optionally installs workspace dependencies and runs each package's sync script for IDE-ready local usage.

```sh
pnpm pipeline setup --sync                              # all matrix packages
pnpm pipeline setup --sync --packages=@matrix/mcp # targeted
pnpm pipeline setup --no-install                        # generate files only
```

The Dagger runner reuses the same managed generators when materializing synthetic consumers inside containers.

Parent: [matrix/README.md](../README.md).
