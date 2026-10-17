/**
 * Local artifact staging utility for multi-platform native builds.
 * Copies compiled .node binaries from local download directories into package distribution roots.
 * Each binary's .inputs.sha256 stamp is copied beside it, since the stamp is the claim that the binary is fresh.
 * Used during local development and CI artifact assembly pipelines.
 */
import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { artifactsDir, packageDir } from '../shared/paths.js'

if (!existsSync(artifactsDir)) {
  console.log('No local artifacts directory found for @reference-ui/rust')
  process.exit(0)
}

let copied = 0
let stamped = 0
for (const entry of readdirSync(artifactsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const artifactPath = join(artifactsDir, entry.name)
  for (const file of readdirSync(artifactPath, { withFileTypes: true })) {
    if (!file.isFile() || !file.name.endsWith('.node')) continue

    copyFileSync(join(artifactPath, file.name), join(artifactsDir, file.name))
    copied += 1

    const stampName = file.name.replace(/\.node$/, '.inputs.sha256')
    if (existsSync(join(artifactPath, stampName))) {
      copyFileSync(join(artifactPath, stampName), join(artifactsDir, stampName))
      stamped += 1
    }
  }
}

console.log(`Staged ${copied} native artifact(s) into @reference-ui/rust (${stamped} with inputs stamps)`)
