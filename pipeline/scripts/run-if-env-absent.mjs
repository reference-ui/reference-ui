/**
 * Conditional command wrapper for package scripts.
 *
 * Takes an env var name and a shell command; exits quietly when the variable is
 * set, otherwise runs the command with inherited stdio. Emits nothing on success.
 */
import { execSync } from 'node:child_process'

const [envName, command] = process.argv.slice(2)

if (!envName || !command) {
  console.error('Usage: node pipeline/scripts/run-if-env-absent.mjs <ENV_NAME> <command>')
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