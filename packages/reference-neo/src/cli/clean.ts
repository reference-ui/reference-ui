// CLI clean command: it takes the project dir and emits a removed out dir
// plus pruned scope links. Clean is a writer-kind lock holder: it acquires
// the session lock first (killing any live holder per the matrix), wipes via
// the preserving cleanDir, releases, and drops the emptied root — so a clean
// landing mid-sync can no longer replay the rm-window race. The link list
// stays derived from the packager's PACKAGES, never mirrored. Reporting
// stays here; the subsystems own the list, the wipe, and the link surgery.
import { Option } from 'commander'
import type { Command } from 'commander'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getOutDirPath } from '../lib/paths/out-dir.ts'
import { removeGeneratedLink } from '../lib/symlink/index.ts'
import { getShortName } from '../packager/layout.ts'
import { PACKAGES } from '../packager/packages.ts'
import { cleanDir, removeDirIfEmpty } from '../sync/clean.ts'
import { SYNC_LOCK_DIR_NAME } from '../sync/session-owner.ts'
import { acquireSyncSession } from '../sync/session.ts'
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
    // Read before the acquire mkdirs: the message reports the pre-clean state.
    const hadFolder = existsSync(outDir)
    const session = await acquireSyncSession({ cwd, kind: 'clean' })
    let links = 0
    try {
      // The stage nests inside the out dir, so the wipe takes it too — even
      // one a killed sync stranded.
      await cleanDir(outDir, { preserve: [SYNC_LOCK_DIR_NAME] })
      links = removeScopeLinks(cwd, outDir)
    } finally {
      session.release()
    }
    await removeDirIfEmpty(outDir)
    if (!hadFolder && links === 0) {
      console.log(`[ref] clean: nothing to remove at ${outDir}`)
      return 0
    }
    console.log(`[ref] clean removed ${outDir} (${links} links)`)
    return 0
  } catch (err) {
    console.log(`[ref] clean failed: ${messageOf(err)}`)
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
