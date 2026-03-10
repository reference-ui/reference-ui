/**
 * Tsup plugin: copy .liquid templates from source dirs to a destination.
 * Used so bundled workers can read templates via __dirname.
 */

import { cp, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface CopyLiquidOptions {
  /** Source directories to read .liquid files from */
  sources: string[]
  /** Destination directory (e.g. dist/cli/config) */
  dest: string
}

export async function copyLiquidTemplates(options: CopyLiquidOptions): Promise<void> {
  const { sources, dest } = options

  for (const srcDir of sources) {
    const files = await readdir(srcDir)
    const liquidFiles = files.filter((f) => f.endsWith('.liquid'))
    await Promise.all(
      liquidFiles.map((f) => cp(join(srcDir, f), join(dest, f)))
    )
  }
}
