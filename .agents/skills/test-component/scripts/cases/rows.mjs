/**
 * Counts static parameter tables using the lexical binding at each declaration.
 * Simple literal title cells yield exact runtime titles for selection and proof;
 * unsupported title values stay explicit instead of evaluating application code.
 */
import { format } from 'node:util'
import { lookupBinding, unwrap } from './syntax.mjs'

function resolveValue(input, scope, seen = new Set()) {
  const node = unwrap(input)
  if (node?.type !== 'Identifier') return { node, scope }
  const binding = lookupBinding(scope, node.value)
  if (!binding || !binding.constant || !binding.node || seen.has(binding)) throw new Error('each tables need resolvable immutable local bindings')
  if (binding.tainted) throw new Error(`each table ${node.value} is mutated or escapes static analysis; use a distinct immutable const array`)
  seen.add(binding)
  return resolveValue(binding.node, binding.scope, seen)
}

export function staticRows(input, scope) {
  const resolved = resolveValue(input, scope)
  if (resolved.node?.type !== 'ArrayExpression' || resolved.node.elements.some(row => !row || row.spread)) {
    throw new Error('each table must be a nonempty static array without spread rows')
  }
  if (resolved.node.elements.length === 0) throw new Error('each table must not be empty')
  return resolved.node.elements.map(row => ({ node: row.expression, scope: resolved.scope }))
}

function primitive(input, scope) {
  const { node } = resolveValue(input, scope)
  if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node?.type)) return node.value
  if (node?.type === 'NullLiteral') return null
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].cooked
  if (node?.type === 'UnaryExpression' && ['+', '-'].includes(node.operator) && node.argument.type === 'NumericLiteral') {
    return node.operator === '-' ? -node.argument.value : node.argument.value
  }
  throw new Error('title value is not a supported literal')
}

function property(input, scope, key) {
  let resolved = resolveValue(input, scope)
  for (const name of key.split('.')) {
    if (resolved.node?.type !== 'ObjectExpression') throw new Error('title property needs a static object')
    const match = resolved.node.properties.find(item => item.type === 'KeyValueProperty' &&
      ['Identifier', 'StringLiteral'].includes(item.key.type) && item.key.value === name)
    if (!match) throw new Error('title property is not statically available')
    resolved = resolveValue(match.value, resolved.scope)
  }
  const value = primitive(resolved.node, resolved.scope)
  if (typeof value !== 'string') return String(value)
  // Vitest object placeholders quote strings; complicated/truncated displays
  // require a catalog ID instead of guessed grep selection.
  if (value.length > 38 || /['\\\x00-\x1f]/.test(value)) throw new Error('unsupported object title display')
  return `'${value}'`
}

function expand(title, row, index) {
  let argument = 0
  const resolved = resolveValue(row.node, row.scope)
  const cells = resolved.node?.type === 'ArrayExpression' ? resolved.node.elements : [{ expression: resolved.node }]
  return title.replace(/%%|%[sdifjoO#$]|\$[A-Za-z_][\w.]*/g, token => {
    if (token === '%%') return '%'
    if (token === '%#') return String(index)
    if (token === '%$') return String(index + 1)
    if (token.startsWith('$')) return property(resolved.node, resolved.scope, token.slice(1))
    if (!['%s', '%d', '%i', '%f'].includes(token)) throw new Error('unsupported parameter title formatter')
    const cell = cells[argument++]
    if (!cell || cell.spread) throw new Error('title cell is missing or dynamic')
    return format(token, primitive(cell.expression, resolved.scope))
  })
}

export function expandedTitles(title, rows) {
  try { return rows.map((row, index) => expand(title, row, index)) }
  catch { return null }
}
