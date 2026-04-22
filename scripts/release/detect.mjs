import { appendFileSync } from 'node:fs'
import { RUST_PACKAGE, getReleaseTargetPackages, isPublished } from './shared.mjs'

function writeGithubOutput(name, value) {
  const githubOutput = process.env.GITHUB_OUTPUT
  if (!githubOutput) return

  appendFileSync(githubOutput, `${name}<<EOF\n${value}\nEOF\n`)
}

const { previousRef, publicPackages, releasePackages } = getReleaseTargetPackages()
const unpublishedPackages = releasePackages
  .filter((pkg) => !isPublished(pkg.name, pkg.version))
  .map(({ dir, private: isPrivate, ...pkg }) => pkg)

const skippedUnpublishedPackages = publicPackages
  .filter((pkg) => !releasePackages.some((target) => target.name === pkg.name))
  .filter((pkg) => !isPublished(pkg.name, pkg.version))
  .map(({ dir, private: isPrivate, ...pkg }) => pkg)

const shouldPublish = unpublishedPackages.length > 0
const needsRust = unpublishedPackages.some((pkg) => pkg.name === RUST_PACKAGE)

console.log(
  JSON.stringify(
    {
      previousRef,
      shouldPublish,
      needsRust,
      releasePackages: unpublishedPackages,
      unpublishedPackages,
      skippedUnpublishedPackages,
    },
    null,
    2
  )
)

writeGithubOutput('should_publish', String(shouldPublish))
writeGithubOutput('needs_rust', String(needsRust))
writeGithubOutput('release_packages_json', JSON.stringify(unpublishedPackages))
writeGithubOutput('unpublished_packages_json', JSON.stringify(unpublishedPackages))
