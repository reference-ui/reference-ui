import { execSync } from 'node:child_process'

const [envName, command] = process.argv.slice(2)

if (!envName || !command) {
  console.error('Usage: node scripts/pipeline/run-if-env-absent.mjs <ENV_NAME> <command>')
  process.exit(1)
}

if (process.env[envName]) {
  process.exit(0)
}

execSync(command, {
  env: process.env,
  shell: true,
  stdio: 'inherit',
})