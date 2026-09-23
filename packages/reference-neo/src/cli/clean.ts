// CLI clean command: it takes the project dir and emits an empty out dir
// plus pruned scope links. The link list stays derived from the packager's
// PACKAGES, never mirrored; the folder wipe goes through the retrying
// cleanDir primitive sync itself uses, so a concurrent writer's landing
// converges instead of failing the remove. Reporting stays here; the
// subsystems own the list, the wipe, and the link surgery.
import { Option } from 'commander'
import type { Command } from 'commander'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getOutDirPath } from '../lib/paths/out-dir.ts'
import { removeGeneratedLink } from '../lib/symlink/index.ts'
import { getShortName } from '../packager/layout.ts'
import { PACKAGES } from '../packager/packages.ts'
import { cleanDir } from '../sync/clean.ts'
import { messageOf, printUsageError } from './output.ts'

const LINKED_PACKAGES = PACKAGES.map((pkg) => getShortName(pkg.name))

export interface CleanCommandOptions {
  watch?: boolean
}

function removeScopeLinks(dir: string, outDir: string): number {
  let removed = 0
  for (const name of LINKED_PACKAGES) {
    const linkPath = join(dir, 'node_modules', '@reference-ui', name)
    if (removeGeneratedLink(linkPath, outDir)) {
      removed += 1
    }
  }
  return removed
}

export async function runCleanCommand(dir: string | undefined, watch: boolean): Promise<number> {
  if (watch) return printUsageError('clean takes no --watch')
  const cwd = resolve(dir ?? process.cwd())
  const outDir = getOutDirPath(cwd)
  try {
    const hadFolder = existsSync(outDir)
    await cleanDir(outDir)
    const links = removeScopeLinks(cwd, outDir)
    if (!hadFolder && links === 0) {
      console.log(`[neo] clean: nothing to remove at ${outDir}`)
      return 0
    }
    console.log(`[neo] clean removed ${outDir} (${links} links)`)
    return 0
  } catch (err) {
    console.log(`[neo] clean failed: ${messageOf(err)}`)
    return 1
  }
}

export function registerCleanCommand(program: Command, report: (code: number) => void): void {
  program
    .command('clean')
    .description('remove the generated folder plus the scope links sync made')
    .argument('[dir]', 'project dir (defaults to cwd)')
    .addOption(new Option('--watch', 'sync only').hideHelp())
    .action(async (dir: string | undefined, options: CleanCommandOptions) => {
      report(await runCleanCommand(dir, options.watch ?? false))
    })
}
