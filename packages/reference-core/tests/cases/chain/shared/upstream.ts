// upstream.ts — the shared sync-and-wire helper for the chain cases that sync a real upstream (CORE-CHAIN-08 to -17).
// It takes a real upstream or consumer directory, syncs it for real, and reads back what it published:
// the base system and the evaluated spec. It rewrites a canonical ui.config.ts to import published base
// systems and compose them in order, installs a world package into the world's node_modules the way a
// package manager leaves it, and restores the canonical spelling with a resync. It also reads a probe's
// computed paint from the served page. Each case states its own wiring and its own claims.
import fs from 'node:fs'
import path from 'node:path'
import type { SpecPage } from '../../../shared/page.ts'
import { sync } from '../../../../src/sync/index.ts'

const CONFIG_FILE = 'ui.config.ts'
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/core'"
const EMPTY_EXTENDS = 'extends: [],'
const OUT_DIR = '.reference-ui'

/** One published base system a consumer imports: its binding name and the path to its baseSystem.mjs. */
export interface UpstreamLink {
  binding: string
  from: string
}

/** The base system an upstream published on its last sync, narrowed to the fields these cases read. */
export interface PublishedBaseSystem {
  name: string
  fragment: string
}

/** The evaluated spec a directory's last sync wrote: resolved token leaves, by category, then by leaf. */
export interface EvaluatedSystem {
  tokens: Record<string, Record<string, { value: string }>>
}

/** The canonical ui.config.ts text of one directory, as committed. */
export function canonicalConfig(dir: string): string {
  return fs.readFileSync(path.join(dir, CONFIG_FILE), 'utf8')
}

/** Writes one config spelling into a directory without resyncing it. */
export function writeConfig(dir: string, text: string): void {
  fs.writeFileSync(path.join(dir, CONFIG_FILE), text, 'utf8')
}

// Replaces one anchor; a count other than one means the canonical config changed shape.
function swapOnce(text: string, anchor: string, replacement: string): string {
  if (text.split(anchor).length !== 2) {
    throw new Error(`canonical ui.config must hold ${JSON.stringify(anchor)} exactly once`)
  }
  return text.replace(anchor, replacement)
}

/** The canonical config with each link imported and the bindings listed under extends, then layers, in order. */
export function wireConfig(
  canonical: string,
  links: UpstreamLink[],
  extendsList: string[],
  layersList: string[] = [],
): string {
  const imports = links.map((link) => `import { baseSystem as ${link.binding} } from '${link.from}'`)
  const withImports = swapOnce(canonical, CONFIG_IMPORT, [CONFIG_IMPORT, ...imports].join('\n'))
  const buckets = [`extends: [${extendsList.join(', ')}],`]
  if (layersList.length > 0) buckets.push(`layers: [${layersList.join(', ')}],`)
  return swapOnce(withImports, EMPTY_EXTENDS, buckets.join('\n  '))
}

/**
 * Installs a package directory where Node resolves `name` from anywhere in the world: a
 * `world/node_modules/<name>` link to `dir`, the shape a workspace package manager leaves. The engine follows
 * a bare import through it to the directory and reads the system that package published there. Returns the
 * install, for `uninstallPackage`.
 */
export function installPackage(worldDir: string, name: string, dir: string): string {
  const target = freshInstall(worldDir, name)
  fs.symlinkSync(path.relative(path.dirname(target), dir), target, 'dir')
  return target
}

/**
 * Installs a copy of a package directory at `world/node_modules/<name>`, the shape a registry install leaves:
 * the package sits inside node_modules, so it brings its own runtime and never borrows the app's. Returns the
 * install, for `uninstallPackage`.
 */
export function installCopy(worldDir: string, name: string, dir: string): string {
  const target = freshInstall(worldDir, name)
  fs.cpSync(dir, target, { recursive: true })
  return target
}

// The install path for one package name, cleared of any earlier install and with its parent made.
function freshInstall(worldDir: string, name: string): string {
  const target = path.join(worldDir, 'node_modules', ...name.split('/'))
  fs.rmSync(target, { force: true, recursive: true })
  fs.mkdirSync(path.dirname(target), { recursive: true })
  return target
}

/** Removes one install (a link goes, never its target) and the node_modules folders it leaves empty. */
export function uninstallPackage(worldDir: string, install: string): void {
  fs.rmSync(install, { force: true, recursive: true })
  const top = path.join(worldDir, 'node_modules')
  for (let dir = path.dirname(install); dir.startsWith(top); dir = path.dirname(dir)) {
    if (!fs.existsSync(dir) || fs.readdirSync(dir).length > 0) return
    fs.rmdirSync(dir)
  }
}

/** Syncs one upstream for real and returns the base system it published. */
export async function syncUpstream(dir: string): Promise<PublishedBaseSystem> {
  await sync(dir)
  const raw = fs.readFileSync(path.join(dir, OUT_DIR, 'system', 'baseSystem.mjs'), 'utf8')
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem
}

/** The evaluated spec the last sync of a directory wrote. */
export function readEvaluated(dir: string): EvaluatedSystem {
  const file = path.join(dir, OUT_DIR, 'system', 'evaluated-system.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as EvaluatedSystem
}

/** The computed text color of one probe on the served page, read once the probe is in the DOM. */
export async function paintOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`)
  await node.waitFor()
  return node.evaluate((el) => getComputedStyle(el).color)
}

/** Puts the canonical config back and resyncs, so the tree is canonical whatever a case did. */
export async function restoreDir(dir: string, canonical: string): Promise<void> {
  writeConfig(dir, canonical)
  await sync(dir)
}
