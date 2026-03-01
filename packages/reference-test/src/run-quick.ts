/**
 * Run tests for default project (from ref-test.config.json).
 */

import { execa } from 'execa'
import { loadConfig } from './config.js'
import { MATRIX, getPort } from './matrix.js'

async function main() {
  const cfg = loadConfig()
  const project = MATRIX.find((e) => e.name === cfg.defaultProject)
  if (!project) throw new Error(`Unknown defaultProject: ${cfg.defaultProject}`)

  await execa('pnpm', ['run', 'test:prepare'], {
    env: { ...process.env, REF_TEST_PROJECT: project.name },
    stdio: 'inherit',
  })

  await execa('pnpm', ['exec', 'playwright', 'test', '--project', project.name], {
    env: {
      ...process.env,
      REF_TEST_PROJECT: project.name,
      REF_TEST_PORT: String(getPort(project)),
    },
    stdio: 'inherit',
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
