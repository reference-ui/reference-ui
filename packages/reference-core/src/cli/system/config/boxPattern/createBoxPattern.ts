import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { log } from '../../../lib/log'
import { runCollectScript } from '../../collectors/runCollectScript'
import { scanForBoxExtensions } from '../../eval/scanner'
import { buildCollectEntryContent } from './collectEntryTemplate'
import { generateBoxPatternContent } from './generateBoxPattern'

/**
 * Run extendBoxPattern files to collect extensions, then generate box.ts
 * with the actual inlined transform logic from each.
 *
 * Output: src/styled/props/box.ts
 */
export async function createBoxPattern(coreDir: string): Promise<string> {
  const styledDir = resolve(coreDir, 'src/styled')
  const extensionPaths = scanForBoxExtensions([styledDir])

  if (extensionPaths.length === 0) {
    log.debug('system:box', 'No pattern() files found')
    return ''
  }

  log.debug('system:box', `Found ${extensionPaths.length} extension files`)

  const collectEntryContent = buildCollectEntryContent({
    refDir: resolve(coreDir, '.ref'),
    outputPath: resolve(coreDir, '.ref/extensions.json'),
    initCollectorPath: resolve(
      coreDir,
      'src/cli/system/config/boxPattern/initCollector.ts'
    ),
    extendBoxPatternPath: resolve(
      coreDir,
      'src/cli/system/config/boxPattern/extendBoxPattern.ts'
    ),
    extensionFilePaths: extensionPaths,
  })

  const extensions = await runCollectScript<
    Array<{ properties: Record<string, unknown>; transformSource: string }>
  >({
    coreDir,
    entryContent: collectEntryContent,
    entryBasename: 'collect-extensions',
    jsonFilename: 'extensions.json',
    logLabel: 'system:box',
  })

  const boxPath = resolve(coreDir, 'src/styled/props/box.ts')
  const content = generateBoxPatternContent(extensions)
  writeFileSync(boxPath, content)
  log.debug('system:box', 'Wrote box pattern to src/styled/props/box.ts')

  return boxPath
}
