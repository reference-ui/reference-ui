# Release Process

This repo uses **Changesets** for version intent and changelogs, and the **Dagger pipeline** (`pnpm pipeline`, `pnpm release`) as the authority for building and publishing packages to npm.

GitHub Actions in this repository only builds and deploys the documentation site to GitHub Pages (see `.github/workflows/docs.yml`). It does not run the test matrix or npm release.

The developer-facing flow is:

1. Run `pnpm changeset` on your branch.
2. Commit the changeset with your code changes.
3. Merge that branch to `main`.
4. Materialize versions (see below) so package versions and changelogs land in git—typically a dedicated branch/PR opened by a maintainer or your org’s CI.
5. Merge that versioning change.
6. Run the pipeline release against the resulting `main` (or your release branch) to publish to npm.

## Step By Step

### 1. Add a changeset on your branch

From the repo root:

```bash
pnpm changeset
```

Choose the published package or packages that changed and the right bump level.

Add a changeset when the branch changes something consumers would care about in a published package, such as:

- runtime behavior
- public API
- types
- package build output
- a changelog-worthy fix

You usually do not need a changeset for private app-only or docs-only work.

Never include fixture packages in changesets. Fixture libraries and apps under `fixtures/*` are internal test/support packages, not release targets.

### 2. Commit the changeset with the branch

The changeset file should be committed along with the feature or fix.

### 3. Merge the branch to `main`

After the branch lands on `main`, pending changeset files describe unreleased intent. Nothing publishes automatically from GitHub Actions.

### 4. Materialize versions (release PR or equivalent)

Apply pending changesets to bump versions and write changelogs:

```bash
pnpm version-packages
```

That runs:

```bash
changeset version && pnpm install --lockfile-only
```

Commit the result (often as a PR titled along the lines of “Version Packages”) and merge it when ready. Your team may automate opening that PR outside this repo’s Actions; what matters is that the version bump commit exists before publish.

### 5. Publish with the pipeline

From a clean checkout at the release commit, with npm credentials configured for the public registry:

```bash
pnpm install --frozen-lockfile
pnpm release
```

`pnpm release` is an alias for `pnpm pipeline release`. To inspect what would publish first:

```bash
pnpm pipeline release plan
```

The pipeline builds and packs release artifacts, then publishes them in dependency-safe order (including `@reference-ui/rust` when it is in the plan). See `pipeline/src/release/` for implementation details.

## Short Version

If your branch changes a published package:

1. run `pnpm changeset`
2. commit it on the branch
3. merge the branch
4. merge a follow-up that runs `pnpm version-packages` (version + changelog commit)
5. run `pnpm release` from the pipeline when you intend to publish

## What Gets Released

Public packages in this repo:

- `@reference-ui/core`
- `@reference-ui/lib`
- `@reference-ui/rust`
- `@reference-ui/icons`

These private packages are ignored by Changesets:

- `@fixtures/atlas-project`
- `@fixtures/demo-ui`
- `@fixtures/extend-library`
- `@fixtures/layer-library`
- `@fixtures/styletrace-consumer`
- `@fixtures/styletrace-library`
- `@reference-ui/reference-unit`
- `@reference-ui/reference-docs`
- `@reference-ui/reference-e2e`

That ignore list comes from [.changeset/config.json](../.changeset/config.json).

## Are Packages Published In Lockstep?

No.

This repo is not configured for lockstep versioning.

Why:

- `.changeset/config.json` has empty `fixed` and `linked` arrays
- package versions already differ across the repo

So published packages can version independently when needed.

`@reference-ui/icons` is its own package, but it is part of the same root Changesets and npm release flow.

## Recommended Validation Before Release

Before publishing, run the checks your team relies on—for example:

```bash
pnpm install --frozen-lockfile
pnpm run test:ci:unit
```

For a broader pass:

```bash
pnpm run test:full
```

Pipeline-oriented checks (see `pipeline/` and root `package.json` `pipeline:*` scripts) should match what your CI runs.

## Important Commands

- `pnpm changeset`
- `pnpm version-packages`
- `pnpm pipeline release plan`
- `pnpm release` (same as `pnpm pipeline release`)

## Notes On `@reference-ui/rust`

Publishing that package may require native artifacts for every supported target. The pipeline’s local release path explains what is missing if your machine cannot build them all; supply artifacts under `packages/reference-rs/artifacts` from your release build environment when needed.
