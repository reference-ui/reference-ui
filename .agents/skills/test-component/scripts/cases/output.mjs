/**
 * Formats catalog listings and parses the catalog command surface without
 * importing the side-effectful runner. JSON output stays one parseable value
 * with no human trailer, and the positional and flag command forms cannot drift.
 */

const COMMANDS = ['list', 'search', 'check', 'run']

export function parseCatalogInvocation(args) {
  const result = { command: '', query: '', selector: '', json: false, list: false }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (i === 0 && COMMANDS.includes(arg)) {
      result.command = arg
      if (arg === 'search') {
        const value = args[++i]
        if (value === undefined || value.startsWith('--')) throw new Error('search needs a query value.')
        result.query = value
      } else if (arg === 'run') {
        const value = args[++i]
        if (!value || value.startsWith('-')) throw new Error('run needs a catalog case ID or component name.')
        result.selector = value
      }
    } else if (arg === '--search') {
      result.command = 'search'
      const value = args[++i]
      if (value === undefined || value.startsWith('--')) throw new Error('--search needs a query value.')
      result.query = value
    } else if (arg === '--list') {
      result.list = true
    } else if (arg === '--json') {
      result.json = true
    }
  }
  return result
}

export function toCatalogRecord(entry) {
  return {
    id: entry.id,
    name: entry.name,
    component: entry.component,
    kind: entry.kind,
    file: entry.file,
    line: entry.line,
    title: entry.title,
    parameterized: Boolean(entry.parameterized),
    rows: entry.rows,
  }
}

export function formatCatalogJson(entries) {
  return JSON.stringify(entries.map(toCatalogRecord), null, 2)
}

export function writeCatalogOutput(stream, output) {
  return new Promise((resolve, reject) => {
    stream.write(`${output}\n`, error => error ? reject(error) : resolve())
  })
}

export function formatCatalogHuman(entries) {
  return entries.map(entry => [
    `${entry.id} [${entry.kind.toUpperCase()}] ${entry.name}`,
    `  src/components/${entry.component}/${entry.file}:${entry.line}${entry.parameterized ? ` (${entry.rows} rows)` : ''}`,
  ].join('\n')).join('\n')
}

export function listingExitCode(command, count) {
  return command === 'search' && count === 0 ? 1 : 0
}
