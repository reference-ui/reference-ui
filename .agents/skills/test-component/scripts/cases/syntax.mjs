/**
 * Resolves lexical source bindings without loading or evaluating test modules.
 * Framework aliases retain their declaration identity, while unknown computed
 * modifiers fail explicitly instead of dropping declarations from the catalog.
 */
export function children(node) {
  const flatten = value => {
    if (!value || typeof value !== 'object') return []
    if (Array.isArray(value)) return value.flatMap(flatten)
    return value.type ? [value] : Object.values(value).flatMap(flatten)
  }
  return Object.values(node).flatMap(flatten)
}

export function unwrap(node) {
  return ['TsAsExpression', 'TsConstAssertion', 'TsSatisfiesExpression', 'ParenthesisExpression'].includes(node?.type)
    ? unwrap(node.expression) : node
}

const CANONICAL = { it: ['it'], test: ['test'], describe: ['describe'], xit: ['it', 'skip'], xtest: ['test', 'skip'], xdescribe: ['describe', 'skip'], fit: ['it', 'only'], fdescribe: ['describe', 'only'] }
const FUNCTIONS = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']

export function lookupBinding(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (current.bindings.has(name)) return current.bindings.get(name)
  }
  return null
}

function bindPattern(pattern, scope, value) {
  if (pattern?.type === 'Identifier') scope.bindings.set(pattern.value, value)
  else if (pattern) {
    for (const child of children(pattern)) bindPattern(child, scope, { ...value, unsupported: true })
  }
}

export function sourceScope(node, parent = null, params = []) {
  const scope = { parent, node, bindings: new Map() }
  for (const param of params) bindPattern(param.pat || param, scope, { scope, unsupported: true })
  const collect = current => {
    if (current !== node && (current.type === 'BlockStatement' || FUNCTIONS.includes(current.type))) {
      if (current.type === 'FunctionDeclaration') bindPattern(current.identifier, scope, { scope, unsupported: true })
      return
    }
    if (current.type === 'ImportDeclaration') {
      const framework = /^(vitest|@playwright\/[^/]+)$|(?:^|\/)playwright\/ct$/.test(current.source.value)
      for (const specifier of current.specifiers) {
        const imported = specifier.imported?.value || specifier.local.value
        const names = framework && specifier.type === 'ImportNamespaceSpecifier' ? ['namespace']
          : framework && specifier.type === 'ImportStarAsSpecifier' ? ['namespace']
          : framework ? CANONICAL[imported] : null
        scope.bindings.set(specifier.local.value, { scope, names: names || [], unsupported: !names })
      }
      return
    }
    if (current.type === 'VariableDeclaration') {
      for (const declaration of current.declarations) {
        bindPattern(declaration.id, scope, { scope, node: declaration.init, constant: current.kind === 'const' })
      }
      return
    }
    for (const child of children(current)) collect(child)
  }
  collect(node)
  return scope
}

// Object values and array elements may carry a framework test function, so an
// aggregated callee fails closed instead of silently dropping a declaration.
function aggregateValue(property) {
  if (!property || typeof property !== 'object') return null
  if (property.type === 'SpreadElement') return property.arguments || property.expr || property.expression || null
  if (property.type === 'Identifier' || property.type === 'StringLiteral' || property.type === 'NumericLiteral') return property
  return property.value || property.expression || null
}

function aggregateNames(node, scope, seen) {
  const found = []
  const visit = candidate => {
    const bound = unwrap(candidate)
    if (!bound) return
    if (bound.type === 'ObjectExpression' || bound.type === 'ArrayExpression') {
      found.push(...aggregateNames(bound, scope, seen))
      return
    }
    found.push(...testNames(candidate, scope, seen))
  }
  if (node.type === 'ObjectExpression') {
    for (const property of node.properties || []) visit(aggregateValue(property))
  } else if (node.type === 'ArrayExpression') {
    for (const element of node.elements || []) visit(element?.expression || element)
  }
  return found
}

// A framework test function hidden inside an unsupported expression (a
// destructured object/array, conditional, sequence, or logical chain) has no
// resolvable declaration identity, so it fails closed rather than vanishing
// beside a recognized declaration. Ordinary values stay harmless.
function frameworkValue(input, scope, seen = new Set()) {
  const node = unwrap(input)
  if (!node) return false
  if (node.type === 'Identifier') return testNames(node, scope, seen).length > 0
  if (node.type === 'ObjectExpression') return (node.properties || []).some(property => frameworkValue(aggregateValue(property), scope, seen))
  if (node.type === 'ArrayExpression') return (node.elements || []).some(element => frameworkValue(element?.expression || element, scope, seen))
  if (node.type === 'ConditionalExpression') return frameworkValue(node.test, scope, seen) || frameworkValue(node.consequent, scope, seen) || frameworkValue(node.alternate, scope, seen)
  if (node.type === 'SequenceExpression') return (node.expressions || []).some(expression => frameworkValue(expression, scope, seen))
  if (['LogicalExpression', 'BinaryExpression', 'AssignmentExpression'].includes(node.type)) return frameworkValue(node.left, scope, seen) || frameworkValue(node.right, scope, seen)
  if (node.type === 'MemberExpression') return frameworkValue(node.object, scope, seen) || (node.property?.type === 'Computed' && frameworkValue(node.property.expression, scope, seen))
  if (['CallExpression', 'NewExpression', 'TaggedTemplateExpression'].includes(node.type)) return frameworkValue(node.callee || node.tag, scope, seen) || (node.arguments || []).some(argument => frameworkValue(argument?.expression || argument, scope, seen))
  if (node.type === 'TemplateLiteral') return (node.expressions || []).some(expression => frameworkValue(expression, scope, seen))
  return false
}

export function testNames(input, scope, seen = new Set()) {
  const node = unwrap(input)
  if (node?.type === 'Identifier') {
    const binding = lookupBinding(scope, node.value)
    if (!binding) return CANONICAL[node.value] || []
    if (binding.names) return binding.names
    if (binding.unsupported) {
      if (frameworkValue(binding.node, binding.scope, seen)) throw new Error(`unsupported framework test alias ${node.value}; bind test declarations directly to a framework function`)
      return []
    }
    if (seen.has(binding)) return []
    seen.add(binding)
    const value = unwrap(binding.node)
    if (value && ['ObjectExpression', 'ArrayExpression'].includes(value.type) &&
      aggregateNames(value, binding.scope, seen).length) {
      throw new Error(`unsupported aggregated test alias ${node.value}; bind test declarations directly to a framework function`)
    }
    const names = testNames(binding.node, binding.scope, seen)
    if (names.length && !binding.constant) throw new Error('test aliases must be immutable local bindings')
    return names
  }
  if (node?.type === 'MemberExpression') {
    const names = testNames(node.object, scope, seen)
    if (!names.length) return []
    const property = node.property.type === 'Computed' ? unwrap(node.property.expression) : node.property
    const member = ['Identifier', 'StringLiteral'].includes(property.type) ? property.value : null
    if (!member || (node.property.type === 'Computed' && property.type !== 'StringLiteral')) {
      throw new Error('computed test modifiers must be static strings')
    }
    return names[0] === 'namespace' ? CANONICAL[member] || [] : [...names, member]
  }
  if (node?.type === 'CallExpression') {
    const names = testNames(node.callee, scope, seen)
    if (names.length) return names
    if (node.arguments.some(argument => frameworkValue(argument.expression, scope, seen))) {
      throw new Error('unsupported framework alias factory expression; bind test declarations directly to a framework function')
    }
    return []
  }
  if (node?.type === 'TaggedTemplateExpression') return [...testNames(node.tag, scope, seen), 'tagged']
  if (frameworkValue(node, scope, seen)) throw new Error('unsupported framework alias expression; bind test declarations directly to a framework function')
  return []
}

export function functionNode(node) {
  return FUNCTIONS.includes(node.type)
}
