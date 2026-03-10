import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises'
import { dirname, join, relative, extname } from 'node:path'
import { createReadStream, existsSync } from 'node:fs'
import { transformFile } from './transform'
import { log } from '../lib/log'
import { TRANSFORMED_EXTENSIONS, isTransformExtension } from './config.internal'

const TRANSFORM_MARKERS = ['@reference-ui/react'] as const
const MAX_MARKER_LENGTH = Math.max(...TRANSFORM_MARKERS.map((m) => m.length))

/**
 * Copy a file to the virtual directory, applying transforms if needed.
 * Transform is part of the copy operation – no separate events.
 * @returns The absolute path of the file written in the virtual dir
 */
export async function copyToVirtual(
  sourcePath: string,
  sourceDir: string,
  virtualDir: string,
  options: { debug?: boolean } = {}
): Promise<string> {
  const { debug } = options

  const relativePath = relative(sourceDir, sourcePath)
  let destPath = join(virtualDir, relativePath)
  const sourceExt = extname(sourcePath)

  const destDir = dirname(destPath)
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true })
  }

  const shouldTransform =
    sourceExt === '.mdx' ||
    (isTransformExtension(sourceExt) &&
      (await fileContainsMarkers(sourcePath, TRANSFORM_MARKERS)))

  if (!shouldTransform) {
    await copyFile(sourcePath, destPath)
    return destPath
  }

  const content = await readFile(sourcePath, 'utf-8')
  const result = await transformFile({
    sourcePath,
    content,
    sourceDir,
    debug,
  })

  if (result.extension) {
    const oldExt = extname(destPath)
    destPath = destPath.slice(0, -oldExt.length) + result.extension
  }

  await writeFile(destPath, result.content, 'utf-8')

  if (result.transformed) {
    log.debug('virtual', `✓ ${relativePath}`)
  }

  return destPath
}

/**
 * Remove a file from the virtual directory.
 */
export async function removeFromVirtual(
  sourcePath: string,
  sourceDir: string,
  virtualDir: string
): Promise<void> {
  const fs = await import('node:fs/promises')

  const relativePath = relative(sourceDir, sourcePath)
  const destPath = join(virtualDir, relativePath)

  log.debug('virtual', `Removing: ${relativePath}`)

  const unlinkIfExists = async (p: string) => {
    try {
      await fs.unlink(p)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err
    }
  }

  if (existsSync(destPath)) {
    await unlinkIfExists(destPath)
  }

  for (const ext of TRANSFORMED_EXTENSIONS) {
    const transformedPath = destPath.replace(extname(destPath), ext)
    if (existsSync(transformedPath) && transformedPath !== destPath) {
      await unlinkIfExists(transformedPath)
    }
  }
}

async function fileContainsMarkers(
  filePath: string,
  markers: readonly string[]
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf-8' })
    let tail = ''
    let settled = false

    const settle = (result: boolean) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    stream.on('data', (chunk) => {
      const data = tail + chunk
      for (const marker of markers) {
        if (data.includes(marker)) {
          stream.close()
          settle(true)
          return
        }
      }
      tail = data.slice(-MAX_MARKER_LENGTH)
    })

    stream.on('error', (error) => {
      if (!settled) {
        settled = true
        reject(error)
      }
    })

    stream.on('close', () => settle(false))
    stream.on('end', () => settle(false))
  })
}
