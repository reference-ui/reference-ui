import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { artifactsDir, packageDir } from '../shared/paths'

if (!existsSync(artifactsDir)) {
  console.log('No local artifacts directory found for @reference-ui/rust')
  process.exit(0)
}

let copied = 0
for (const entry of readdirSync(artifactsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const artifactPath = join(artifactsDir, entry.name)
  for (const file of readdirSync(artifactPath, { withFileTypes: true })) {
    if (!file.isFile() || !file.name.endsWith('.node')) continue

    copyFileSync(join(artifactPath, file.name), join(packageDir, file.name))
    copied += 1
  }
}

console.log(`Staged ${copied} native artifact(s) into @reference-ui/rust`)
