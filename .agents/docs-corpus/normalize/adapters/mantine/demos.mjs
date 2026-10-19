/**
 * Demo and styles-API source from the clone. A demo is an exported object
 * whose `code` is a template literal, a variable holding one (in the same file
 * or imported from one), an arrow function returning one (a configurator whose
 * code follows its controls, shown with the `${...}` parts as written), or an
 * array of `{ fileName, code, language }` entries. Styles-API data files hold
 * the selector, variable and modifier descriptions the site's tables render.
 */

import { bindingOf, importsOf, readClone, resolveSpec } from './modules.mjs'
import { cell, objectProperties, parseValue, Ref, SPREADS, skipSpace, skipValue, Unsupported } from './literal.mjs'

const ARROW_TEMPLATE = /^\(\s*[\w$]*(?:\s*:\s*[^)]*)?\)\s*=>\s*`/

/** Where `const NAME = ...` or `export const NAME: T = ...` starts its value, or -1. */
export function declarationValue(text, name) {
  const re = new RegExp(`(?:^|\\n)(?:export\\s+)?(?:const|let|var)\\s+${name.replace(/\$/g, '\\$')}\\b[^=\\n]*=\\s*`)
  const m = re.exec(text)
  return m ? m.index + m[0].length : -1
}

/** A value at `pos`: an arrow-function template is read as its raw template; any other literal as written. */
function valueAt(clone, file, text, pos) {
  const arrow = ARROW_TEMPLATE.exec(text.slice(pos, pos + 200))
  if (arrow) return parseValue(text, pos + arrow[0].length - 1, { rawExpressions: true }).value
  return parseValue(text, pos, { interpolate: name => variableText(clone, file, name) }).value
}

/** The string a template variable holds: declared in `file`, or imported from another file. */
function variableText(clone, file, name, depth = 0) {
  if (depth > 6) throw new Unsupported(`variable chain too long at ${name}`)
  const text = readClone(file)
  const start = declarationValue(text, name)
  if (start >= 0) {
    const value = valueAt(clone, file, text, start)
    if (typeof value !== 'string') throw new Unsupported(`${name} is not a string`)
    return value
  }
  const bind = importsOf(file).get(name)
  const target = bind ? resolveSpec(clone, file, bind.spec) : null
  const hit = target && bind.imported !== '*' && bind.imported !== 'default' ? bindingOf(clone, target, bind.imported) : null
  if (hit && hit.file) return variableText(clone, hit.file, hit.name, depth + 1)
  throw new Unsupported(`no declaration of ${name}`)
}

/** The code of one entry: a literal, a template variable, or a reference to one. */
function codeOf(clone, file, value) {
  if (typeof value === 'string') return value
  if (value instanceof Ref) return variableText(clone, file, value.name)
  throw new Unsupported('code is not a literal')
}

/** One entry of a multi-file demo: { fileName, language, code }, or { fileName, language, missing }. */
function entryOf(clone, file, entry) {
  if (!entry || typeof entry !== 'object') throw new Unsupported('code entry')
  const base = {
    fileName: typeof entry.fileName === 'string' ? entry.fileName : '',
    language: typeof entry.language === 'string' ? entry.language : '',
  }
  try {
    return { ...base, code: codeOf(clone, file, entry.code) }
  } catch (err) {
    if (!(err instanceof Unsupported)) throw err
    return { ...base, missing: err.message }
  }
}

/**
 * Each source file of a demo. In a multi-file array, an entry that cannot be
 * read (for example a file built at build time) is kept as `missing`, with its
 * name from the source text, so the other files still render.
 */
function filesOf(clone, file, text, pos, value) {
  if (!Array.isArray(value) && !(text[pos] === '[')) {
    return [{ fileName: '', language: '', code: codeOf(clone, file, value) }]
  }
  const files = []
  let i = skipSpace(text, pos + 1)
  while (text[i] !== ']') {
    const start = i
    try {
      files.push(entryOf(clone, file, parseValue(text, start).value))
    } catch (err) {
      if (!(err instanceof Unsupported)) throw err
      const element = text.slice(start, skipValue(text, start))
      files.push({
        fileName: element.match(/fileName:\s*['"]([^'"]*)['"]/)?.[1] ?? '',
        language: element.match(/language:\s*['"]([^'"]*)['"]/)?.[1] ?? '',
        missing: err.message,
      })
    }
    i = skipSpace(text, skipValue(text, start))
    if (text[i] === ',') i = skipSpace(text, i + 1)
    else if (text[i] !== ']') throw new Unsupported('file list separator')
  }
  return files
}

/** Source files of the demo exported as `name` from `file`. Throws Unsupported when the shape is not read. */
export function readDemo(clone, file, name) {
  const text = readClone(file)
  const start = declarationValue(text, name)
  if (start < 0) throw new Unsupported(`no declaration of ${name}`)
  if (text[start] !== '{') throw new Unsupported(`${name} is not an object`)
  const props = objectProperties(text, start)
  if (!props.has('code')) throw new Unsupported(`${name} has no code`)
  const pos = props.get('code')
  // An array is read entry by entry; anything else is one file (a shorthand `code,` parses to a Ref).
  if (text[pos] === '[') return filesOf(clone, file, text, pos, null)
  return filesOf(clone, file, text, pos, valueAt(clone, file, text, pos))
}

/** A fenced block whose fence is longer than any backtick run the code holds. */
export function fenced(lang, code) {
  const body = code.replace(/^\s*\n/, '').replace(/\n+$/, '')
  const longest = Math.max(0, ...[...body.matchAll(/^\s*(`{3,})/gm)].map(m => m[1].length))
  const mark = '`'.repeat(Math.max(3, longest + 1))
  return [`${mark}${lang}`, body, mark].join('\n')
}

/** Markdown for a demo's files: one fence, or a bold file name above each fence. */
export function demoMarkdown(files) {
  return files
    .map(f => {
      const block =
        f.missing === undefined
          ? fenced(f.language || 'tsx', f.code)
          : `> ${f.fileName || 'File'} is not in this clone (${f.missing}).`
      return f.fileName ? `**${f.fileName}**\n\n${block}` : block
    })
    .join('\n\n')
}

/** A value with its object spreads merged in, the way `{ ...Other.selectors, own }` reads. */
function withSpreads(value, clone, file, depth) {
  if (Array.isArray(value)) return value.map(v => withSpreads(v, clone, file, depth))
  if (!value || typeof value !== 'object') return value
  if (depth > 8) throw new Unsupported('spread chain too long')
  const out = {}
  for (const { ref } of value[SPREADS] ?? []) Object.assign(out, spreadSource(clone, file, ref, depth + 1))
  for (const [key, v] of Object.entries(value)) out[key] = withSpreads(v, clone, file, depth)
  return out
}

/** The object a spread names (`Popover.selectors` after an import, or a local declaration). */
function spreadSource(clone, file, ref, depth) {
  const [head, ...path] = ref.split('.')
  const bind = importsOf(file).get(head)
  let source
  if (bind) {
    const target = resolveSpec(clone, file, bind.spec)
    const hit = target && bind.imported !== 'default' && bind.imported !== '*' ? bindingOf(clone, target, bind.imported) : null
    if (!hit || !hit.file) throw new Unsupported(`spread ${ref} is not in this clone`)
    source = readStylesApi(clone, hit.file, hit.name, depth)
  } else {
    const text = readClone(file)
    const start = declarationValue(text, head)
    if (start < 0) throw new Unsupported(`spread ${ref} has no declaration`)
    source = withSpreads(parseValue(text, start).value, clone, file, depth)
  }
  let obj = source
  for (const key of path) obj = obj?.[key]
  if (!obj || typeof obj !== 'object') throw new Unsupported(`spread ${ref} is not an object`)
  return obj
}

/** The styles-API object exported as `name` from a data file: plain literal data, spreads resolved. */
export function readStylesApi(clone, file, name, depth = 0) {
  const text = readClone(file)
  const start = declarationValue(text, name)
  if (start < 0) throw new Unsupported(`no ${name}`)
  return withSpreads(parseValue(text, start).value, clone, file, depth)
}

/** Selector | Description table; null when the data has no selectors. */
export function selectorsTable(data) {
  const rows = Object.entries(data.selectors ?? {})
  if (!rows.length) return null
  return [
    '| Selector | Description |',
    '| --- | --- |',
    ...rows.map(([name, text]) => `| \`${name}\` | ${cell(text)} |`),
  ].join('\n')
}

/** Modifier | Selector | Condition table, from the data's `modifiers` list. */
export function modifiersTable(data) {
  const rows = data.modifiers ?? []
  if (!rows.length) return null
  return [
    '| Modifier | Selector | Condition |',
    '| --- | --- | --- |',
    ...rows.map(m => {
      const selectors = [].concat(m.selector).map(s => `\`${s}\``).join(', ')
      return `| \`${m.modifier}\` | ${selectors} | ${cell(m.condition ?? m.value ?? '')} |`
    }),
  ].join('\n')
}

/** Variable | Selector | Description table, from the data's `vars` (selector -> variable -> text). */
export function variablesTable(data) {
  const rows = []
  for (const [selector, variables] of Object.entries(data.vars ?? {})) {
    for (const [variable, text] of Object.entries(variables)) {
      rows.push(`| \`${variable}\` | \`${selector}\` | ${cell(text)} |`)
    }
  }
  if (!rows.length) return null
  return ['| Variable | Selector | Description |', '| --- | --- | --- |', ...rows].join('\n')
}
