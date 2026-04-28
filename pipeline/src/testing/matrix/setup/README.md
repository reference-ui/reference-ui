# Matrix Setup

This folder owns the setup step for matrix fixtures.

Setup is the same conceptual step used in both places:

- locally, when a developer runs the matrix fixture setup command
- inside pipeline-managed environment creation, before the isolated test run

Its job is to materialize the managed parts of each matrix fixture package and,
optionally, install the workspace dependencies needed to work with those
fixtures locally.

For IDE-ready local usage, run setup with sync enabled so each selected matrix
package also materializes its generated Reference UI output after install.

- repo-wide: `pnpm matrix:setup`
- targeted: `pnpm pipeline setup --sync --packages=@matrix/playwright`

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/setup/index.test.ts`
