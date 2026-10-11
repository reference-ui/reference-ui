/**
 * Reads the component case manifests as individual searchable evidence records.
 * The catalog remains the source of stable IDs and selectors; this read adapter
 * makes those contracts available through Memex without claiming a test verdict.
 */
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'

const MANIFEST_KEYS = ['schemaVersion', 'component', 'scope', 'description', 'cases']
const CASE_KEYS = ['id', 'name', 'kind', 'file', 'title']

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasOnlyKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every(key => keys.includes(key))
}

function validManifest(manifest, component) {
  return hasOnlyKeys(manifest, MANIFEST_KEYS) && manifest.schemaVersion === 1 &&
    manifest.component === component && ['public', 'support', 'internal'].includes(manifest.scope) &&
    nonempty(manifest.description) && Array.isArray(manifest.cases) &&
    (manifest.cases.length > 0 || manifest.scope === 'internal')
}

function containedPath(file) {
  return nonempty(file) && !isAbsolute(file) && !file.includes('\\') &&
    file.split('/').every(part => part && part !== '..' && part !== '.')
}

function validCase(item, component) {
  return hasOnlyKeys(item, CASE_KEYS) && nonempty(item.id) && item.id === item.id.trim() &&
    /^LIB-[A-Z][A-Z0-9]*-[0-9]{3,}$/.test(item.id) &&
    item.id.startsWith(`LIB-${component.toUpperCase()}-`) &&
    nonempty(item.name) && nonempty(item.title) && containedPath(item.file) &&
    ['unit', 'ct'].includes(item.kind)
}

export function collectComponents(componentsDir, root, name) {
  const docs = []
  const seen = new Set()
  for (const entry of readdirSync(componentsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Component directory must not be a symlink: ${join(componentsDir, entry.name)}`)
    }
    if (!entry.isDirectory()) continue
    const file = join(componentsDir, entry.name, 'case.json')
    if (lstatSync(file).isSymbolicLink()) throw new Error(`Component manifest must not be a symlink: ${file}`)
    const manifest = JSON.parse(readFileSync(file, 'utf8'))
    if (!validManifest(manifest, entry.name)) {
      throw new Error(`Invalid component manifest: ${file}; run pnpm agentct check`)
    }
    for (const item of manifest.cases) {
      if (!validCase(item, entry.name) || seen.has(item.id)) {
        throw new Error(`Invalid or duplicate component case: ${file}; run pnpm agentct check`)
      }
      seen.add(item.id)
      const path = relative(root, join(componentsDir, entry.name, item.file))
      const raw = [
        `component: ${manifest.component} (${manifest.scope})`,
        `layer: ${item.kind}`,
        `evidence: ${path}`,
        `selector: ${item.title}`,
        `run: pnpm agentct run ${item.id}`,
        '', manifest.description,
        '', 'Catalog metadata identifies evidence; only a completed test run determines pass or failure.',
      ].join('\n')
      docs.push({
        collection: name, kind: 'component', id: item.id, title: item.name,
        extra: `${manifest.component} · ${item.kind}`, path,
        snippetText: `${item.title}\n${manifest.description}`,
        fields: { id: item.id, title: item.name, component: manifest.component, layer: item.kind, text: raw },
        payload: { raw, component: manifest.component, layer: item.kind, selector: item.title },
      })
    }
  }
  return { docs, warnings: [] }
}
