# Collections

This directory owns docs content wiring for the package.

- `docs.ts` defines the typed docs collection schema and transforms.
- `index.ts` exports the content-collections config used by the generator.
- `runtime.ts` adapts generated metadata to the current Vite MDX runtime.

The root `content-collections.ts` file still exists because the content-collections CLI and Vite plugin look for that config entrypoint by default. Keep that file thin and put actual collection logic here.

This split is intentional:

- content-collections owns metadata validation and indexing
- Vite still owns MDX module loading
- the docs app keeps its existing MDX theme and React component imports