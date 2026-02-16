import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { microBundle } from '../../lib/microBundle'
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
    console.log('[createBoxPattern] No pattern() files found')
    return ''
  }

  console.log(`[createBoxPattern] Found ${extensionPaths.length} extension files`)

  const refDir = join(coreDir, '.ref')
  if (!existsSync(refDir)) mkdirSync(refDir, { recursive: true })

  const extensionsPath = join(refDir, 'extensions.json')
  const collectEntryPath = join(refDir, 'collect-extensions.ts')

  const collectEntryContent = buildCollectEntryContent({
    refDir,
    outputPath: extensionsPath,
    initBoxCollectorPath: resolve(coreDir, 'src/cli/panda/boxPattern/initBoxCollector.ts'),
    extendBoxPatternPath: resolve(coreDir, 'src/cli/panda/boxPattern/extendBoxPattern.ts'),
    extensionFilePaths: extensionPaths,
  })
  writeFileSync(collectEntryPath, collectEntryContent)

  const bundled = await microBundle(collectEntryPath)
  const collectScriptPath = join(refDir, 'collect-extensions.mjs')
  writeFileSync(collectScriptPath, bundled)

  const result = spawnSync(process.execPath, [collectScriptPath], {
    cwd: coreDir,
    encoding: 'utf-8',
  })
  if (result.status !== 0) {
    throw new Error(`[createBoxPattern] Collect script failed:\n${result.stderr || result.stdout}`)
  }

  const extensions: Array<{ properties: Record<string, unknown>; transformSource: string }> = JSON.parse(
    readFileSync(extensionsPath, 'utf-8')
  )

  rmSync(collectEntryPath, { force: true })
  rmSync(collectScriptPath, { force: true })
  rmSync(extensionsPath, { force: true })

  const boxPath = resolve(coreDir, 'src/styled/props/box.ts')
  const content = generateBoxPatternContent(extensions)
  writeFileSync(boxPath, content)
  console.log('[createBoxPattern] Wrote box pattern to src/styled/props/box.ts')

  return boxPath
}
