/**
 * MCP artifact cache bootstrap for the matrix fixture.
 *
 * The server can build lazily, but prebuilding the model keeps readiness focused
 * on HTTP startup and avoids repeating the expensive Atlas/Tasty work.
 *
 * A prebuilt model is reused only while `.reference-ui/mcp/model.key` matches a
 * SHA-256 over every input that shapes it: the installed MCP child's dist; the
 * installed `@reference-ui/rust` package (its package.json, its dist/ tree minus
 * Cargo build output, and every native `.node` binary); and the fixture (`src/`,
 * the synced `.reference-ui/types/tasty/` the build reads, `ui.config.ts`, `package.json`). Any change rebuilds the model and rewrites the key.
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, sep } from 'node:path'

const RUST_PACKAGE = '@reference-ui/rust'
const NODE_MODULES = 'node_modules'

/** Installed dependencies are not inputs, so every walk skips them. */
const SKIP_NODE_MODULES: ReadonlySet<string> = new Set([NODE_MODULES])
/** Rust build trees (dist/cargo alone is about 17 GB) ship nothing the MCP loads. */
const SKIP_RUST_BUILD_TREES: ReadonlySet<string> = new Set([NODE_MODULES, 'target', 'cargo'])

/** One file that feeds the cache key; `id` is its stable, group-prefixed relative path. */
interface KeyedFile {
  id: string
  abs: string
}

function resolveInstalledMcpChildPath(cwd: string): string {
  const candidates = [
    join(cwd, 'node_modules', '@reference-ui', 'mcp', 'dist', 'mcp-child.mjs'),
    join(process.cwd(), 'packages', 'reference-mcp', 'dist', 'mcp-child.mjs'),
    join(process.cwd(), 'node_modules', '@reference-ui', 'mcp', 'dist', 'mcp-child.mjs'),
    join(cwd, 'node_modules', '@reference-ui', 'core', 'dist', 'cli', 'mcp-child.mjs'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0]
}

function resolveMcpModelPath(cwd: string): string {
  return join(cwd, '.reference-ui', 'mcp', 'model.json')
}

function resolveMcpModelKeyPath(cwd: string): string {
  return join(cwd, '.reference-ui', 'mcp', 'model.key')
}

/** Lists the regular files under `root`; each id is `prefix` plus the path under `root`. */
function listFiles(root: string, prefix: string, skipDirs: ReadonlySet<string>): KeyedFile[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const abs = join(root, entry.name)
    const id = `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      return skipDirs.has(entry.name) ? [] : listFiles(abs, id, skipDirs)
    }
    return entry.isFile() ? [{ id, abs }] : []
  })
}

/** A single input file, or nothing when it is absent. */
function fileIfPresent(id: string, abs: string): KeyedFile[] {
  return statSync(abs, { throwIfNoEntry: false })?.isFile() ? [{ id, abs }] : []
}

function isInside(abs: string, dir: string): boolean {
  return abs.startsWith(`${dir}${sep}`)
}

/** Walks node_modules upward from `dir` to the first installed copy of `name`. */
function findInstalledPackage(dir: string, name: string): string | null {
  const candidate = join(dir, NODE_MODULES, name)
  if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
  const parent = dirname(dir)
  return parent === dir ? null : findInstalledPackage(parent, name)
}

/**
 * Finds the `@reference-ui/rust` package the way the MCP child resolves it: from the
 * child's real location, then from the fixture. `createRequire(...).resolve` is not
 * usable here because the package exports no `./package.json` subpath.
 */
function resolveRustPackageDir(childScript: string, cwd: string): string | null {
  const starts = existsSync(childScript) ? [dirname(realpathSync(childScript)), cwd] : [cwd]
  for (const start of starts) {
    const found = findInstalledPackage(start, RUST_PACKAGE)
    if (found !== null) return found
  }
  return null
}

/** The directory of the `./atlas` entry (dist/ today), or the whole package if it is missing. */
function resolveAtlasDistDir(pkgDir: string): string {
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as {
    exports?: { './atlas'?: { import?: string } }
  }
  const entry = manifest.exports?.['./atlas']?.import
  return entry === undefined ? pkgDir : dirname(join(pkgDir, entry))
}

/** The installed rust package: its package.json, the atlas dist and every `.node` binary. */
function rustFiles(childScript: string, cwd: string): KeyedFile[] {
  const pkgDir = resolveRustPackageDir(childScript, cwd)
  if (pkgDir === null) return []
  const manifest = join(pkgDir, 'package.json')
  const atlasDir = resolveAtlasDistDir(pkgDir)
  return listFiles(pkgDir, 'rust', SKIP_RUST_BUILD_TREES).filter(
    file => file.abs === manifest || file.abs.endsWith('.node') || isInside(file.abs, atlasDir),
  )
}

/** The fixture inputs: `src/`, the synced Tasty types the build reads, and the root config and manifest. */
function fixtureFiles(cwd: string): KeyedFile[] {
  return [
    ...listFiles(join(cwd, 'src'), 'fixture/src', SKIP_NODE_MODULES),
    ...listFiles(join(cwd, '.reference-ui', 'types', 'tasty'), 'fixture/tasty', SKIP_NODE_MODULES),
    ...fileIfPresent('fixture/ui.config.ts', join(cwd, 'ui.config.ts')),
    ...fileIfPresent('fixture/package.json', join(cwd, 'package.json')),
  ]
}

function byId(a: KeyedFile, b: KeyedFile): number {
  if (a.id === b.id) return 0
  return a.id < b.id ? -1 : 1
}

/** Every cache input, sorted by id so the key does not depend on directory order. */
function collectCacheInputs(cwd: string): KeyedFile[] {
  const childScript = resolveInstalledMcpChildPath(cwd)
  return [
    ...listFiles(dirname(childScript), 'mcp', SKIP_NODE_MODULES),
    ...rustFiles(childScript, cwd),
    ...fixtureFiles(cwd),
  ].sort(byId)
}

/** SHA-256 over each input's id, byte length and bytes, in id order. */
export function computeMcpArtifactCacheKey(cwd: string): string {
  const hash = createHash('sha256')
  for (const file of collectCacheInputs(cwd)) {
    const bytes = readFileSync(file.abs)
    hash.update(`${file.id}\0${bytes.length}\0`)
    hash.update(bytes)
  }
  return hash.digest('hex')
}

function readStoredKey(cwd: string): string | null {
  try {
    return readFileSync(resolveMcpModelKeyPath(cwd), 'utf8').trim()
  } catch {
    return null
  }
}

function isCacheCurrent(cwd: string, cacheKey: string): boolean {
  return existsSync(resolveMcpModelPath(cwd)) && readStoredKey(cwd) === cacheKey
}

function spawnMcpBuild(childScript: string, cwd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const child = spawn(process.execPath, [childScript, JSON.stringify({ kind: 'build', cwd })], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    child.once('error', error => {
      reject(error)
    })

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          [
            `mcp-child build failed (code=${code}, signal=${signal})`,
            '',
            'stdout:',
            stdout.trim() || '(empty)',
            '',
            'stderr:',
            stderr.trim() || '(empty)',
          ].join('\n'),
        ),
      )
    })
  })
}

export async function buildMcpArtifactCache(cwd: string): Promise<void> {
  const cacheKey = computeMcpArtifactCacheKey(cwd)
  if (isCacheCurrent(cwd, cacheKey)) {
    return
  }

  const childScript = resolveInstalledMcpChildPath(cwd)

  if (!existsSync(childScript)) {
    throw new Error(`Expected installed MCP child script at ${childScript}`)
  }

  // Remove the old key first: a failed build must not leave a key that vouches for its output.
  rmSync(resolveMcpModelKeyPath(cwd), { force: true })
  await spawnMcpBuild(childScript, cwd)

  mkdirSync(dirname(resolveMcpModelKeyPath(cwd)), { recursive: true })
  writeFileSync(resolveMcpModelKeyPath(cwd), cacheKey)
}
