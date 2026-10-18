// CLI init command: it takes the project dir and emits a default ui.config.ts
// there, named from the dir's package.json. Init never overwrites: when config
// discovery already finds a ui.config in the dir, it names that file and exits
// 1 with nothing written. The name rule is the config validator's own
// isSafeSystemName, so a written config always loads; anything else falls back
// to my-app. Reporting stays in output.ts like every other command's lines.
import { Option } from 'commander'
import type { Command } from 'commander'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { resolveRefConfigFile } from '../lib/paths/index.ts'
import { isSafeSystemName } from '../system/base/validate.ts'
import { formatInitLines, messageOf, printUsageError } from './output.ts'

const CONFIG_FILE = 'ui.config.ts'
const FALLBACK_NAME = 'my-app'

export interface InitCommandOptions {
  watch?: boolean
}

// The package.json name when it is a non-empty string the validator accepts;
// a missing or torn manifest, or any other name, yields the fallback.
function systemNameFor(dir: string): string {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: unknown }
    const name = manifest.name
    if (typeof name === 'string' && name.trim() !== '' && isSafeSystemName(name)) return name
  } catch {
    // No readable manifest: the fallback name below.
  }
  return FALLBACK_NAME
}

// Backslashes never reach here (isSafeSystemName rejects them), so escaping the
// single quote is all the single-quoted literal needs.
export function defaultConfigSource(name: string): string {
  const literal = name.replace(/'/g, "\\'")
  return [
    "import { defineConfig } from '@reference-ui/core'",
    "import { baseSystem } from '@reference-ui/lib/baseSystem'",
    '',
    'export default defineConfig({',
    `  name: '${literal}',`,
    "  include: ['src/**/*.{ts,tsx}'],",
    '  extends: [baseSystem],',
    '})',
    '',
  ].join('\n')
}

export function runInitCommand(dir: string | undefined, watch: boolean): number {
  if (watch) return printUsageError('init takes no --watch')
  const cwd = resolve(dir ?? process.cwd())
  const existing = resolveRefConfigFile(cwd)
  if (existing !== null) {
    console.log(`[ref] init failed: ${existing} already exists; nothing written`)
    return 1
  }
  const target = join(cwd, CONFIG_FILE)
  try {
    writeFileSync(target, defaultConfigSource(systemNameFor(cwd)), { flag: 'wx' })
  } catch (err) {
    console.log(`[ref] init failed: ${messageOf(err)}`)
    return 1
  }
  console.log(formatInitLines(target))
  return 0
}

export function registerInitCommand(program: Command, report: (code: number) => void): void {
  program
    .command('init')
    .description('write a default ui.config.ts into the project dir')
    .argument('[dir]', 'project dir (defaults to cwd)')
    .addOption(new Option('--watch', 'sync only').hideHelp())
    .action((dir: string | undefined, options: InitCommandOptions) => {
      report(runInitCommand(dir, options.watch ?? false))
    })
}
