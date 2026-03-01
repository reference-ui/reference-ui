/**
 * Run tests for default project (from ref-test.config.json).
 */

import { execa } from 'execa'
import { getDefaultProject, prepareProject, projectEnv } from './runner/index.js'

async function main() {
  const project = getDefaultProject()
  await prepareProject(project)

  await execa('pnpm', ['exec', 'playwright', 'test', '--project', project.name], {
    env: projectEnv(project),
    stdio: 'inherit',
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
