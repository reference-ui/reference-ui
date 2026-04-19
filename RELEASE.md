# Release Process

This repo uses Changesets plus GitHub Actions for releases.

The developer-facing flow is:

1. Run `pnpm changeset` on your branch.
2. Commit the changeset with your code changes.
3. Merge that branch to `main`.
4. GitHub Actions creates or updates a release PR.
5. Merge that generated release PR.
6. GitHub Actions publishes the packages.

That is the main workflow people should follow.

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

### 2. Commit the changeset with the branch

The changeset file should be committed along with the feature or fix.

### 3. Merge the branch to `main`

After the branch lands on `main`, the release workflow runs after the `Test` workflow succeeds.

### 4. GitHub Actions creates or updates the release PR

Yes, this is automated in this repo.

The workflow in [.github/workflows/release.yml](/Users/ryn/Developer/reference-ui/.github/workflows/release.yml) has a step named `Create or update release PR` and uses `changesets/action@v1` with:

```yaml
with:
	version: pnpm version-packages
```

So after changesets reach `main`, GitHub Actions is responsible for opening or updating the release PR.

### 5. Merge the generated release PR

That PR is where package versions and changelogs are actually written into git.

The workflow uses:

```bash
pnpm version-packages
```

which runs:

```bash
changeset version && pnpm install --lockfile-only
```

### 6. Publish happens after the generated PR is merged

Yes, that is the intended flow here.

Once that PR is merged, the release workflow checks whether there are unpublished package versions. If there are no pending changesets left and unpublished versions exist, it runs the publish job.

So the normal sequence is:

1. feature branch with changeset merges to `main`
2. release PR is created
3. release PR is merged
4. publish job runs

## Short Version

If your branch changes a published package:

1. run `pnpm changeset`
2. commit it on the branch
3. merge the branch
4. merge the generated release PR
5. let Actions publish

## What Gets Released

Public packages in this repo:

- `@reference-ui/core`
- `@reference-ui/lib`
- `@reference-ui/rust`
- `@reference-ui/icons`

These private packages are ignored by Changesets:

- `@reference-ui/reference-unit`
- `@reference-ui/reference-docs`
- `@reference-ui/reference-e2e`

That ignore list comes from [.changeset/config.json](/Users/ryn/Developer/reference-ui/.changeset/config.json).

## Are Packages Published In Lockstep?

No.

This repo is not configured for lockstep versioning.

Why:

- `.changeset/config.json` has empty `fixed` and `linked` arrays
- package versions already differ across the repo

So published packages can version independently when needed.

## Recommended Validation Before Merge

Before merging a branch that adds changesets, the safest baseline is:

```bash
pnpm install --frozen-lockfile
pnpm run test:ci:unit
```

For a broader pass:

```bash
pnpm run test:full
```

## Important Commands

- `pnpm changeset`
- `pnpm version-packages`
- `pnpm run release:detect`
- `pnpm run release:publish`

## Manual Fallback

Normally, do not publish manually.

If you ever need to reproduce the release flow locally:

```bash
pnpm version-packages
pnpm install --frozen-lockfile
pnpm run test:ci:unit
pnpm run release:publish
```

## Notes On Automation

[scripts/release/detect.mjs](/Users/ryn/Developer/reference-ui/scripts/release/detect.mjs) checks which current package versions are not yet published on npm.

`@reference-ui/rust` has one extra step: the workflow may compile native artifacts first, then publish them before the normal Changesets publish step.

That detail matters operationally, but most developers do not need to think about it during normal release prep.