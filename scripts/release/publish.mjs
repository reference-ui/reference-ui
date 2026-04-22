import {
  RUST_PACKAGE,
  getReleaseTargetPackages,
  isPublished,
  run,
  sortPackagesForPublish,
} from './shared.mjs'

const { releasePackages } = getReleaseTargetPackages()
const unpublishedPackages = sortPackagesForPublish(
  releasePackages.filter((pkg) => !isPublished(pkg.name, pkg.version))
)
if (unpublishedPackages.length === 0) {
  console.log('No unpublished release-target packages found.')
  process.exit(0)
}

if (unpublishedPackages.some((pkg) => pkg.name === RUST_PACKAGE)) {
  console.log('Publishing native packages for @reference-ui/rust')
  run('pnpm', ['--filter', RUST_PACKAGE, 'run', 'publish:native'])
}

for (const pkg of unpublishedPackages) {
  console.log(`Publishing ${pkg.name}@${pkg.version}`)
  run('pnpm', ['publish', '--no-git-checks', '--access', 'public'], {
    cwd: pkg.dir,
  })
}
