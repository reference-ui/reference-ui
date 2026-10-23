/**
 * Builds the component case catalog from the live source and public barrel (AGENTS.md section 7).
 * Each folder under `<Component>/__e2e__/` is one CT case named by its raw ID (LIB-<COMPONENT>-<nnn>)
 * holding case.json {id, name}, a README.md headed "# <ID> — <name>", and one *.ct.spec.ts with one
 * declaration; every *.test.ts(x) outside __e2e__ yields unit entries labelled <Component>/<file>:<line>.
 * A component-level case.json is a retired manifest and fails the catalog.
 * Every problem is collected and thrown once; metadata never substitutes for executing the evidence.
 */
import fs from 'node:fs'
import path from 'node:path'
import { discoverTests, exportedComponents } from './discover.mjs'

const CASE_KEYS = ['id', 'name']
const README_HEADING = /^# (.+?) — (.*)$/
const CT_SPEC = /\.ct\.spec\.ts$/
const UNIT_TEST = /\.test\.tsx?$/

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
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

function discover(dir, file, problems) {
  try { return discoverTests(path.join(dir, file)) }
  catch (error) { problems.push(error.message); return null }
}

function caseJsonProblems(folder, caseDir) {
  const file = path.join(caseDir, 'case.json')
  if (!fs.existsSync(file)) return { name: undefined, problems: [`no case.json; add {"id": "${folder}", "name": "<one-line claim>"}`] }
  let value
  try { value = JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (error) { return { name: undefined, problems: [`case.json is not valid JSON (${error.message})`] } }
  if (!object(value)) return { name: undefined, problems: ['case.json must be a JSON object'] }
  const problems = []
  for (const key of Object.keys(value)) {
    if (!CASE_KEYS.includes(key)) problems.push(`case.json has unknown field "${key}"; only "id" and "name" are allowed`)
  }
  if (value.id !== folder) problems.push(`case.json id ${value.id === undefined ? 'is missing' : `is ${JSON.stringify(value.id)}`}; it must equal folder name "${folder}"`)
  const name = typeof value.name === 'string' ? value.name : undefined
  if (name === undefined || name.trim() === '') problems.push('case.json needs a non-empty string "name"')
  return { name, problems }
}

function readmeProblems(folder, caseDir, name) {
  const expected = `"# ${folder} — ${name ?? '<one-line claim>'}"`
  const file = path.join(caseDir, 'README.md')
  if (!fs.existsSync(file)) return [`no README.md; its first line must be ${expected}`]
  const heading = README_HEADING.exec(fs.readFileSync(file, 'utf8').split(/\r?\n/, 1)[0])
  if (!heading) return [`README.md first line must be ${expected}`]
  const problems = []
  if (heading[1] !== folder) problems.push(`README.md heading names "${heading[1]}"; it must name folder "${folder}"`)
  if (heading[2].trim() === '') problems.push('README.md heading has no claim after the em dash')
  else if (name !== undefined && heading[2] !== name) problems.push(`README.md heading claim "${heading[2]}" must equal case.json name "${name}"`)
  return problems
}

// One CT case folder: the folder name, case.json, README.md and its single one-declaration spec.
function readCaseFolder(folder, specs, context) {
  const { component, dir, errors } = context
  const caseDir = path.join(dir, '__e2e__', folder)
  const problems = []
  if (!new RegExp(`^LIB-${component.toUpperCase()}-\\d{3,}$`).test(folder)) {
    problems.push(`folder is not named by a raw case ID (LIB-${component.toUpperCase()}-<nnn>)`)
  }
  const { name, problems: indexProblems } = caseJsonProblems(folder, caseDir)
  problems.push(...indexProblems, ...readmeProblems(folder, caseDir, name))
  let entry = null
  if (specs.length !== 1) {
    problems.push(`a case folder holds exactly one *.ct.spec.ts evidence file (found ${specs.length})`)
  } else {
    const file = `__e2e__/${folder}/${specs[0]}`
    const declarations = discover(dir, file, problems)
    if (declarations && declarations.length !== 1) {
      problems.push(`${specs[0]} must hold exactly one declaration (found ${declarations.length})`)
    } else if (declarations) {
      entry = { ...declarations[0], id: folder, name, kind: 'ct', file, component, absoluteFile: path.join(dir, file) }
    }
  }
  for (const problem of problems) errors.push(`${component}/__e2e__/${folder}: ${problem}`)
  return problems.length ? null : entry
}

// Sorts each evidence file into its case folder, the unit set, or a misplaced-evidence error.
function classifyEvidence(component, files, errors, folders) {
  const specsByFolder = new Map(folders.map(folder => [folder, []]))
  const unitFiles = []
  for (const file of files) {
    const parts = file.split('/')
    const inE2e = parts[0] === '__e2e__'
    if (UNIT_TEST.test(file)) {
      if (inE2e) errors.push(`${component}/${file}: unit test files cannot live under __e2e__; move it beside the source`)
      else unitFiles.push(file)
    } else if (CT_SPEC.test(file)) {
      if (inE2e && parts.length === 3 && specsByFolder.has(parts[1])) specsByFolder.get(parts[1]).push(parts[2])
      else errors.push(`${component}/${file}: CT specs must live in __e2e__/<ID>/ (one case folder per spec)`)
    }
  }
  return { specsByFolder, unitFiles }
}

function caseFolders(dir, errors, component) {
  const e2e = path.join(dir, '__e2e__')
  if (!fs.existsSync(e2e)) return []
  const folders = []
  for (const entry of fs.readdirSync(e2e, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) errors.push(`${component}/__e2e__/${entry.name}: symlinks cannot be case folders`)
    else if (entry.isDirectory()) folders.push(entry.name)
  }
  return folders.sort()
}

function readComponent(component, context) {
  const { componentsDir, errors, exported } = context
  const dir = path.join(componentsDir, component)
  if (fs.existsSync(path.join(dir, 'case.json'))) errors.push(`${component}: component manifests are retired; cases live in __e2e__/<ID>/`)
  let files = []
  try { files = evidenceFiles(dir) }
  catch (error) { errors.push(`${component}: ${error.message}`) }
  const folders = caseFolders(dir, errors, component)
  const { specsByFolder, unitFiles } = classifyEvidence(component, files, errors, folders)
  const ct = []
  for (const folder of folders) {
    const entry = readCaseFolder(folder, specsByFolder.get(folder) || [], { component, dir, errors })
    if (entry) ct.push(entry)
  }
  const unit = []
  for (const file of unitFiles) {
    const problems = []
    for (const declaration of discover(dir, file, problems) || []) {
      unit.push({ ...declaration, id: `${component}/${file}:${declaration.line}`, name: declaration.title, kind: 'unit', file, component, absoluteFile: path.join(dir, file) })
    }
    errors.push(...problems)
  }
  const cases = [...ct.sort((a, b) => a.id.localeCompare(b.id)), ...unit.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))]
  if (exported.has(component) && cases.length === 0) errors.push(`${component}: exported component has no CT cases or unit declarations`)
  return { component, cases }
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
  const components = names.map(component => readComponent(component, { componentsDir, errors, exported }))
  const cases = components.flatMap(component => component.cases)
  const seen = new Map()
  for (const entry of cases) {
    if (seen.has(entry.id)) errors.push(`${entry.component}: duplicate catalog case id ${entry.id} (also ${seen.get(entry.id)})`)
    seen.set(entry.id, entry.component)
  }
  if (errors.length) throw new Error(`Component case conformity failed (${errors.length}):\n${errors.map(error => `- ${error}`).join('\n')}`)
  const ct = cases.filter(entry => entry.kind === 'ct').sort((a, b) => a.id.localeCompare(b.id))
  const unit = cases.filter(entry => entry.kind === 'unit').sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { components, cases: [...ct, ...unit] }
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
