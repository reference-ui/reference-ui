/**
 * Validates the component catalog against the live source and public barrel.
 * Every component directory and every runnable declaration is accounted for;
 * metadata never substitutes for executing the registered evidence.
 */
import fs from 'node:fs'
import path from 'node:path'
import { discoverTests, exportedComponents } from './discover.mjs'

const MANIFEST_KEYS = ['schemaVersion', 'component', 'scope', 'description', 'cases']
const CASE_KEYS = ['id', 'name', 'kind', 'file', 'title']
const SCOPES = ['public', 'support', 'internal']

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, allowed, label, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label}: unknown field ${key}`)
  }
}

export function evidenceFiles(dir) {
  const files = []
  const walk = (current, prefix = '') => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) throw new Error(`${relative}: symlinks cannot be case evidence`)
      if (entry.isDirectory()) walk(path.join(current, entry.name), relative)
      else if (/\.test\.tsx?$|\.ct\.spec\.ts$/.test(entry.name)) files.push(relative)
    }
  }
  walk(dir)
  return files.sort()
}

function evidenceInventory(dir, errors) {
  const inventory = new Map()
  try {
    for (const file of evidenceFiles(dir)) {
      try { inventory.set(file, discoverTests(path.join(dir, file))) }
      catch (error) { errors.push(error.message) }
    }
  } catch (error) { errors.push(`${dir}: ${error.message}`) }
  return inventory
}

function validateCase(entry, context) {
  const { component, inventory, errors, seenIds, seenEvidence } = context
  const label = `${component}/case.json ${entry?.id || '(case)'}`
  if (!object(entry)) {
    errors.push(`${label}: case must be an object`)
    return null
  }
  exactKeys(entry, CASE_KEYS, label, errors)
  if (!nonempty(entry.id) || entry.id !== entry.id.trim() || !/^LIB-[A-Z][A-Z0-9]*-[0-9]{3,}$/.test(entry.id)) errors.push(`${label}: id must be LIB-COMPONENT-NNN`)
  if (nonempty(entry.id) && !entry.id.startsWith(`LIB-${component.toUpperCase()}-`)) errors.push(`${label}: id must belong to ${component}`)
  if (seenIds.has(entry.id)) errors.push(`${label}: duplicate global case id (also ${seenIds.get(entry.id)})`)
  seenIds.set(entry.id, component)
  if (!nonempty(entry.name)) errors.push(`${label}: name must be nonempty`)
  if (!['unit', 'ct'].includes(entry.kind)) errors.push(`${label}: kind must be unit or ct`)
  if (!nonempty(entry.title)) errors.push(`${label}: title must be the full static declaration title`)
  const file = entry.file
  if (!nonempty(file) || path.isAbsolute(file) || file.includes('\\') || file.split('/').some(part => part === '..' || part === '.' || !part)) {
    errors.push(`${label}: file must be a contained POSIX path relative to its component`)
    return null
  }
  const declarations = inventory.get(file)
  if (!declarations) {
    errors.push(`${label}: missing or invalid evidence file ${file}`)
    return null
  }
  const declaration = declarations.find(test => test.title === entry.title)
  if (!declaration) {
    errors.push(`${label}: stale title in ${file}: ${entry.title}`)
    return null
  }
  if (entry.kind !== declaration.kind) errors.push(`${label}: kind does not match ${file}`)
  const key = `${file}\0${entry.title}`
  if (seenEvidence.has(key)) errors.push(`${label}: declaration already indexed by ${seenEvidence.get(key)}`)
  seenEvidence.set(key, entry.id)
  return { ...entry, ...declaration, component, absoluteFile: path.join(context.dir, file) }
}

function validateComponent(component, context) {
  const { componentsDir, errors, exported, seenIds } = context
  const dir = path.join(componentsDir, component)
  const inventory = evidenceInventory(dir, errors)
  const manifestFile = path.join(dir, 'case.json')
  let manifest
  try {
    if (fs.lstatSync(manifestFile).isSymbolicLink()) throw new Error('manifest must not be a symlink')
    manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  } catch (error) {
    errors.push(`${component}/case.json: ${error.code === 'ENOENT' ? 'missing component manifest' : error.message}`)
    return null
  }
  if (!object(manifest)) {
    errors.push(`${component}/case.json: manifest must be an object`)
    return null
  }
  exactKeys(manifest, MANIFEST_KEYS, `${component}/case.json`, errors)
  if (manifest.schemaVersion !== 1) errors.push(`${component}/case.json: schemaVersion must be 1`)
  if (manifest.component !== component) errors.push(`${component}/case.json: component must match its directory`)
  if (!SCOPES.includes(manifest.scope)) errors.push(`${component}/case.json: scope must be public, support, or internal`)
  if (exported.has(component) && manifest.scope !== 'public') errors.push(`${component}/case.json: component is publicly exported and must have public scope`)
  if (!exported.has(component) && manifest.scope === 'public') errors.push(`${component}/case.json: public scope has no component export in src/index.ts`)
  if (!nonempty(manifest.description)) errors.push(`${component}/case.json: description must explain its tested surface or internal purpose`)
  if (!Array.isArray(manifest.cases)) {
    errors.push(`${component}/case.json: cases must be an array`)
    return null
  }
  if (manifest.cases.length === 0 && manifest.scope !== 'internal') errors.push(`${component}/case.json: public/support components must have executable cases`)
  const seenEvidence = new Map()
  const cases = manifest.cases.map(entry => validateCase(entry, { component, dir, inventory, errors, seenIds, seenEvidence })).filter(Boolean)
  for (const [file, declarations] of inventory) {
    for (const declaration of declarations) {
      if (!seenEvidence.has(`${file}\0${declaration.title}`)) errors.push(`${component}/${file}: unindexed declaration ${declaration.title}`)
    }
  }
  return { ...manifest, cases }
}

export function loadCatalog(libDir) {
  libDir = path.resolve(libDir)
  const errors = []
  const componentsDir = path.join(libDir, 'src/components')
  const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
  const names = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  for (const entry of entries) {
    if (entry.isSymbolicLink()) errors.push(`${entry.name}: component directories cannot be symlinks`)
  }
  const barrel = fs.readFileSync(path.join(libDir, 'src/index.ts'), 'utf8')
  const exported = exportedComponents(barrel)
  for (const name of exported) {
    if (!names.includes(name)) errors.push(`src/index.ts: exported component directory ${name} is missing`)
  }
  if (names.length === 0) errors.push('component catalog has no component directories')
  const seenIds = new Map()
  const components = names.map(component => validateComponent(component, { componentsDir, errors, exported, seenIds })).filter(Boolean)
  if (errors.length) throw new Error(`Component case conformity failed (${errors.length}):\n${errors.map(error => `- ${error}`).join('\n')}`)
  return { components, cases: components.flatMap(component => component.cases).sort((a, b) => a.id.localeCompare(b.id)) }
}

export function selectCase(catalog, id, component = '') {
  const found = catalog.cases.find(entry => entry.id === id && (!component || entry.component === component))
  if (!found) throw new Error(`Unknown catalog case ${id}${component ? ` for ${component}` : ''}`)
  return found
}

export function searchCases(catalog, query = '', component = '') {
  const needle = query.toLowerCase()
  return catalog.cases.filter(entry => (!component || entry.component === component) &&
    [entry.id, entry.component, entry.name, entry.title, entry.file].some(text => text.toLowerCase().includes(needle)))
}
