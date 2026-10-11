/**
 * Reads real unit and component-test declarations without executing their modules.
 * Suite titles and static `each` tables form precise selectors and expected row counts;
 * unsupported dynamic declarations and disabled tests fail instead of vanishing.
 */
import fs from 'node:fs'
import { parseSync } from '@swc/core'
import { children, functionNode, lookupBinding, sourceScope, testNames, unwrap } from './syntax.mjs'
import { expandedTitles, staticRows } from './rows.mjs'

function memberBase(node) {
  let current = unwrap(node)
  while (current?.type === 'MemberExpression') current = unwrap(current.object)
  return current?.type === 'Identifier' ? current : null
}

// Names handed to an arbitrary call/object escape static immutability proof;
// function bodies are not scanned so callback closures stay ordinary reads.
function escapeNames(input, out = []) {
  const node = unwrap(input)
  if (!node) return out
  if (node.type === 'Identifier') { out.push(node.value); return out }
  if (node.type === 'ObjectExpression') {
    for (const property of node.properties || []) {
      if (property.type === 'SpreadElement') escapeNames(property.arguments || property.expr || property.expression, out)
      else if (property.type === 'Identifier') escapeNames(property, out)
      else escapeNames(property.value || property.expression, out)
    }
    return out
  }
  if (node.type === 'ArrayExpression') {
    for (const element of node.elements || []) escapeNames(element?.expression || element, out)
    return out
  }
  if (node.type === 'MemberExpression') return escapeNames(node.object, out)
  if (['ConditionalExpression', 'LogicalExpression', 'BinaryExpression', 'SequenceExpression'].includes(node.type)) {
    for (const child of children(node)) escapeNames(child, out)
    return out
  }
  if (node.type === 'TemplateLiteral') {
    for (const expression of node.expressions || []) escapeNames(expression, out)
    return out
  }
  return out
}

// Tainting a name marks its binding and every table captured inside its object
// or array initializer, following immutable alias chains under a cycle guard.
function taintName(scope, name, seen = new Set()) {
  const binding = lookupBinding(scope, name)
  if (!binding || seen.has(binding)) return
  seen.add(binding)
  binding.tainted = true
  const node = unwrap(binding.node)
  if (node?.type === 'Identifier') { taintName(binding.scope, node.value, seen); return }
  for (const referenced of escapeNames(node)) taintName(binding.scope, referenced, seen)
}

function checkTableTaint(node, scope) {
  if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
    const base = memberBase(node.type === 'UpdateExpression' ? node.argument : node.left)
    if (base) taintName(scope, base.value)
    return
  }
  if (node.type !== 'CallExpression' && node.type !== 'NewExpression') return
  const callee = unwrap(node.callee)
  const names = testNames(callee, scope)
  const eachTable = ['it', 'test', 'describe'].includes(names[0]) && names.includes('each')
  if (callee?.type === 'MemberExpression') {
    const base = memberBase(callee.object)
    // A namespace or a similarly named foreign method is not a test identity.
    if (base && !eachTable) taintName(scope, base.value)
  }
  ;(node.arguments || []).forEach((argument, index) => {
    if (eachTable && index === 0) return
    for (const name of escapeNames(argument?.expression || argument)) taintName(scope, name)
  })
}

function staticTitle(node) {
  if (node?.type === 'StringLiteral') return node.value
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].cooked
  return null
}

export function titlePattern(title, parameterized = false) {
  const tokens = parameterized ? title.split(/(%%|%[sdifjoO#$]|\$[A-Za-z_][\w.]*)/) : [title]
  return `^${tokens.map(token => parameterized && token === '%%' ? '%' : parameterized && /^(%[sdifjoO#$]|\$[A-Za-z_][\w.]*)$/.test(token)
    ? '[\\s\\S]*?' : token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')}$`
}

export function discoverSource(source, file = 'example.test.ts') {
  // SWC uses a process-global byte position and omits leading comments from
  // Module.span; a sentinel fixes the origin for repeated, UTF-8-safe parsing.
  const ast = parseSync(`;${source}`, { syntax: 'typescript', tsx: file.endsWith('tsx') })
  const tests = []
  const baseOffset = ast.span.start + 1
  // One scope object per node, shared by the escape pre-pass and the discovery
  // walk, so a taint recorded on a binding is visible when its table resolves.
  const scopes = new WeakMap()
  const scopeFor = (node, parent = null, params = []) => {
    if (!scopes.has(node)) scopes.set(node, sourceScope(node, parent, params))
    return scopes.get(node)
  }

  const scanTables = (node, scope) => {
    if (node.type === 'ImportDeclaration') return
    if (functionNode(node)) {
      scanTables(node.body, scopeFor(node.body, scope, node.params || []))
      return
    }
    if (node.type === 'BlockStatement' && scope.node !== node) scope = scopeFor(node, scope)
    checkTableTaint(node, scope)
    for (const child of children(node)) scanTables(child, scope)
  }

  const walk = (node, scope, suites = [], insideLoop = false) => {
    if (node.type === 'ImportDeclaration') return
    if (node.type === 'VariableDeclarator' && node.id.type !== 'Identifier' && testNames(node.init, scope).length) {
      throw new Error(`${file}: destructured test aliases are unsupported`)
    }
    if (functionNode(node)) {
      walk(node.body, scopeFor(node.body, scope, node.params || []), suites, insideLoop)
      return
    }
    if (node.type === 'BlockStatement' && scope.node !== node) scope = scopeFor(node, scope)
    if (node.type === 'TaggedTemplateExpression' && testNames(node.tag, scope).length) {
      throw new Error(`${file}: tagged test declarations are unsupported`)
    }
    if (node.type !== 'CallExpression') {
      const loop = insideLoop || ['ForStatement', 'ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement'].includes(node.type)
      for (const child of children(node)) walk(child, scope, suites, loop)
      return
    }
    const names = testNames(node.callee, scope)
    const root = names[0]
    const suite = root === 'describe' || (root === 'test' && names.includes('describe'))
    const test = root === 'it' || (root === 'test' && !suite)
    if (!suite && !test) {
      for (const child of children(node)) walk(child, scope, suites, insideLoop)
      return
    }
    if (names.some(name => ['beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'use', 'setTimeout', 'configure', 'info', 'step'].includes(name))) return
    if (names.includes('tagged')) throw new Error(`${file}: tagged test declarations are unsupported`)
    // The inner each(table) call is configuration, not a declaration.
    if (names.includes('each') && unwrap(node.callee).type !== 'CallExpression') {
      if (staticTitle(node.arguments[0]?.expression)) throw new Error(`${file}: each declarations need a direct static table call`)
      return
    }
    const title = staticTitle(node.arguments[0]?.expression)
    const callback = node.arguments.find(arg => ['ArrowFunctionExpression', 'FunctionExpression'].includes(arg.expression?.type))?.expression
    const line = Buffer.from(source).subarray(0, node.span.start - baseOffset).toString().split('\n').length
    if (names.some(name => ['skip', 'todo', 'fixme', 'only', 'skipIf', 'runIf'].includes(name))) {
      throw new Error(`${file}:${line}: disabled or focused test/suite cannot be case evidence`)
    }
    if (names.slice(1).some(name => !['describe', 'each', 'concurrent', 'sequential', 'shuffle', 'fails', 'parallel', 'serial'].includes(name))) {
      throw new Error(`${file}:${line}: unsupported test modifier`)
    }
    if (!callback || !title || insideLoop) {
      throw new Error(`${file}:${line}: tests need a static nonempty title and callback outside dynamic loops`)
    }
    if (suite) {
      if (names.includes('each')) throw new Error(`${file}:${line}: parameterized suites need explicit static suites`)
      walk(callback.body, scopeFor(callback.body, scope, callback.params || []), [...suites, title], insideLoop)
      return
    }
    const parameterized = names.includes('each')
    const table = parameterized ? staticRows(unwrap(node.callee).arguments[0]?.expression, scope) : null
    const fullTitle = [...suites, title].join(' ')
    if (tests.some(entry => entry.title === fullTitle)) throw new Error(`${file}:${line}: duplicate declaration title ${fullTitle}`)
    const expanded = table ? expandedTitles(title, table) : [title]
    const prefix = suites.length ? `${suites.join(' ')} ` : ''
    tests.push({ title: fullTitle, kind: file.endsWith('.ct.spec.ts') ? 'ct' : 'unit', line,
      rows: table?.length || 1, parameterized, rowTitles: expanded?.map(value => `${prefix}${value}`) || null })
  }
  scanTables(ast, scopeFor(ast))
  walk(ast, scopeFor(ast))
  if (tests.length === 0) throw new Error(`${file}: evidence file has no runnable test declarations`)
  const owners = new Map()
  for (const entry of tests) {
    for (const title of new Set(entry.rowTitles || [])) {
      if (owners.has(title)) throw new Error(`${file}: ambiguous expanded declaration title ${title}`)
      owners.set(title, entry)
    }
  }
  return tests
}

export function discoverTests(file) {
  return discoverSource(fs.readFileSync(file, 'utf8'), file)
}

export function exportedComponents(source) {
  const ast = parseSync(source, { syntax: 'typescript' })
  return new Set(ast.body.filter(node => ['ExportAllDeclaration', 'ExportNamedDeclaration'].includes(node.type))
    .map(node => node.source?.value).filter(value => value?.startsWith('./components/'))
    .map(value => value.split('/')[2]))
}
