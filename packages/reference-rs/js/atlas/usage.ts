import path from 'node:path'
import * as ts from 'typescript'

import type { AtlasConfig, Component, Usage } from './types'
import type { AnalysisContext, ImportBinding, ParsedFile } from './project'
import { resolveProjectExport, resolveRelativeSourcePath } from './project'
import type { ComponentTemplate } from './resolution'

type MutableComponentState = {
  component: Component
  propValueCounts: Map<string, Map<string, number>>
  exampleShapes: Set<string>
  coUsageCounts: Map<string, number>
}

export function createState(template: ComponentTemplate): MutableComponentState {
  return {
    component: {
      name: template.name,
      interface: template.interface,
      source: template.source,
      count: 0,
      props: template.props.map(prop => ({
        name: prop.name,
        count: 0,
        usage: 'unused',
        values: prop.values
          ? Object.fromEntries(prop.values.map(value => [value, 'unused' as Usage]))
          : undefined,
      })),
      usage: 'unused',
      examples: [],
      usedWith: {},
    },
    propValueCounts: new Map(),
    exampleShapes: new Set(),
    coUsageCounts: new Map(),
  }
}

export function collectUsage(
  context: AnalysisContext,
  states: Map<string, MutableComponentState>
): void {
  const rootTagMap = new Map<string, string>()
  for (const [key, state] of states) {
    if (!state.component.source.startsWith('@')) {
      rootTagMap.set(state.component.name, key)
    }
  }

  for (const file of context.rootFiles) {
    const importMap = buildComponentImportMap(file, context, states)
    const usedKeysInFile = new Set<string>()

    const visit = (node: ts.Node): void => {
      if (ts.isJsxSelfClosingElement(node)) {
        recordJsxUsage(
          node.tagName,
          node.attributes.properties,
          node,
          file,
          importMap,
          rootTagMap,
          states,
          usedKeysInFile
        )
      }

      if (ts.isJsxElement(node)) {
        recordJsxUsage(
          node.openingElement.tagName,
          node.openingElement.attributes.properties,
          node,
          file,
          importMap,
          rootTagMap,
          states,
          usedKeysInFile
        )
      }

      ts.forEachChild(node, visit)
    }

    visit(file.sourceFile)

    for (const key of usedKeysInFile) {
      const state = states.get(key)
      if (!state) {
        continue
      }

      for (const otherKey of usedKeysInFile) {
        if (key === otherKey) {
          continue
        }

        const other = states.get(otherKey)
        if (!other) {
          continue
        }

        state.coUsageCounts.set(
          other.component.name,
          (state.coUsageCounts.get(other.component.name) ?? 0) + 1
        )
      }
    }
  }
}

export function finalizeState(state: MutableComponentState): Component {
  for (const prop of state.component.props) {
    const valueCounts = state.propValueCounts.get(prop.name)
    if (!valueCounts || valueCounts.size === 0) {
      continue
    }

    const knownValues = Object.keys(
      prop.values ??
        Object.fromEntries(Array.from(valueCounts.keys()).map(value => [value, 'unused']))
    )
    prop.values = Object.fromEntries(
      knownValues
        .sort()
        .map(value => [value, usageFromCount(valueCounts.get(value) ?? 0, prop.count)])
    )
  }

  state.component.usedWith = Object.fromEntries(
    Array.from(state.coUsageCounts.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, count]) => [name, usageFromCount(count, state.component.count)])
  )

  return state.component
}

export function calculateUsage(components: Component[]): Component[] {
  const totalCount = components.reduce((sum, component) => sum + component.count, 0)

  for (const component of components) {
    component.usage = usageFromCount(component.count, totalCount)
    const propTotal = component.props.reduce((sum, prop) => sum + prop.count, 0)
    for (const prop of component.props) {
      prop.usage = usageFromCount(prop.count, propTotal)
    }
    component.props.sort((left, right) => left.name.localeCompare(right.name))
  }

  return components
}

export function applyFilters(components: Component[], config?: AtlasConfig): Component[] {
  const excludes = config?.exclude ?? []

  return components.filter(component => {
    return !excludes.some(pattern => {
      if (pattern.includes(':')) {
        const [source, name] = pattern.split(':')
        return component.source === source && component.name === name
      }

      const sourcePath = component.source.replace(/^\.\//, 'src/')
      const regex = globToRegExp(pattern)
      return regex.test(sourcePath) || regex.test(component.name)
    })
  })
}

export function compareComponents(left: Component, right: Component): number {
  if (left.source !== right.source) {
    return left.source.localeCompare(right.source)
  }

  return left.name.localeCompare(right.name)
}

function buildComponentImportMap(
  file: ParsedFile,
  context: AnalysisContext,
  states: Map<string, MutableComponentState>
): Map<string, string> {
  const imports = new Map<string, string>()

  for (const [localName, binding] of file.imports) {
    if (binding.source.startsWith('.')) {
      mapRelativeImportBinding(file.path, binding, localName, context, states, imports)
      continue
    }

    if (binding.importedName === '*') {
      for (const [key, state] of states) {
        if (state.component.source === binding.source) {
          imports.set(`${localName}.${state.component.name}`, key)
        }
      }
      continue
    }

    const key = `${binding.importedName}@@${binding.source}`
    if (states.has(key)) {
      imports.set(localName, key)
    }
  }

  return imports
}

function mapRelativeImportBinding(
  fromFile: string,
  binding: ImportBinding,
  localName: string,
  context: AnalysisContext,
  states: Map<string, MutableComponentState>,
  imports: Map<string, string>
): void {
  const resolvedExport = resolveProjectExport(
    fromFile,
    binding.source,
    binding.importedName,
    context.filesByPath
  )

  if (resolvedExport) {
    for (const [key, state] of states) {
      if (state.component.source.startsWith('@')) {
        continue
      }

      const expected = path.join(
        context.rootSrcDir,
        state.component.source.replace(/^\.\//, '')
      )
      if (!matchesResolvedImport(expected, resolvedExport.file.path)) {
        continue
      }

      if (binding.importedName === '*' || resolvedExport.exportedName === state.component.name) {
        imports.set(localName, key)
        return
      }

      if (binding.importedName === 'default') {
        imports.set(localName, key)
        return
      }
    }
  }

  const resolved = resolveRelativeSourcePath(fromFile, binding.source)

  for (const [key, state] of states) {
    if (state.component.source.startsWith('@')) {
      continue
    }

    const expected = path.join(
      context.rootSrcDir,
      state.component.source.replace(/^\.\//, '')
    )
    if (!matchesResolvedImport(expected, resolved)) {
      continue
    }

    if (binding.importedName === '*') {
      imports.set(`${localName}.${state.component.name}`, key)
      continue
    }

    if (binding.importedName === 'default' || binding.importedName === state.component.name) {
      imports.set(localName, key)
    }
  }
}

function recordJsxUsage(
  tagName: ts.JsxTagNameExpression,
  attributes: ts.NodeArray<ts.JsxAttributeLike>,
  node: ts.Node,
  file: ParsedFile,
  importMap: Map<string, string>,
  rootTagMap: Map<string, string>,
  states: Map<string, MutableComponentState>,
  usedKeysInFile: Set<string>
): void {
  const tagText = getJsxTagNameText(tagName)
  if (!tagText) {
    return
  }

  const key = importMap.get(tagText) ?? rootTagMap.get(tagText)
  if (!key) {
    return
  }

  const state = states.get(key)
  if (!state) {
    return
  }

  usedKeysInFile.add(key)
  state.component.count += 1

  const propsByName = new Map(state.component.props.map(prop => [prop.name, prop]))
  for (const attribute of attributes) {
    if (!ts.isJsxAttribute(attribute)) {
      continue
    }

    const attributeName = getJsxAttributeNameText(attribute.name)
    if (!attributeName) {
      continue
    }

    const prop = propsByName.get(attributeName)
    if (!prop) {
      continue
    }

    prop.count += 1

    const literalValue = getJsxAttributeLiteralValue(attribute.initializer)
    if (!literalValue) {
      continue
    }

    const valueCounts = state.propValueCounts.get(attributeName) ?? new Map<string, number>()
    valueCounts.set(literalValue, (valueCounts.get(literalValue) ?? 0) + 1)
    state.propValueCounts.set(attributeName, valueCounts)
  }

  if (ts.isJsxElement(node) && hasMeaningfulChildren(node.children)) {
    const children = propsByName.get('children')
    if (children) {
      children.count += 1
    }
  }

  const snippet = file.content.slice(node.getStart(file.sourceFile), node.getEnd()).trim()
  const shapeKey = makeExampleShapeKey(snippet)
  if (!state.exampleShapes.has(shapeKey) && state.component.examples.length < 5) {
    state.exampleShapes.add(shapeKey)
    state.component.examples.push(snippet)
  }
}

function getJsxTagNameText(tagName: ts.JsxTagNameExpression): string | undefined {
  if (ts.isIdentifier(tagName)) {
    return tagName.text
  }

  if (ts.isPropertyAccessExpression(tagName)) {
    return tagName.getText()
  }

  if (tagName.kind === ts.SyntaxKind.JsxMemberExpression) {
    const memberExpression = tagName as ts.JsxMemberExpression
    const objectText = getJsxTagNameText(memberExpression.expression)
    return objectText ? `${objectText}.${memberExpression.name.text}` : undefined
  }

  return undefined
}

function usageFromCount(count: number, total: number): Usage {
  if (count === 0 || total === 0) {
    return 'unused'
  }

  const ratio = count / total
  if (ratio >= 0.5) {
    return 'very common'
  }
  if (ratio >= 0.2) {
    return 'common'
  }
  if (ratio >= 0.1) {
    return 'occasional'
  }

  return 'rare'
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`)
}

function getJsxAttributeLiteralValue(
  initializer: ts.JsxAttributeValue | undefined
): string | undefined {
  if (!initializer) {
    return 'true'
  }
  if (ts.isStringLiteral(initializer)) {
    return initializer.text
  }
  if (ts.isJsxExpression(initializer) && initializer.expression) {
    if (
      ts.isStringLiteral(initializer.expression) ||
      ts.isNumericLiteral(initializer.expression)
    ) {
      return initializer.expression.text
    }
    if (
      initializer.expression.kind === ts.SyntaxKind.TrueKeyword ||
      initializer.expression.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return initializer.expression.getText()
    }
  }
  return undefined
}

function getJsxAttributeNameText(name: ts.JsxAttributeName): string | undefined {
  return ts.isIdentifier(name) ? name.text : undefined
}

function matchesResolvedImport(expectedFile: string, resolvedImport: string): boolean {
  return (
    expectedFile === resolvedImport ||
    expectedFile === `${resolvedImport}.ts` ||
    expectedFile === `${resolvedImport}.tsx` ||
    expectedFile === `${resolvedImport}.js` ||
    expectedFile === `${resolvedImport}.jsx`
  )
}

function hasMeaningfulChildren(children: ts.NodeArray<ts.JsxChild>): boolean {
  return children.some(child => {
    if (ts.isJsxText(child)) {
      return child.getText().trim().length > 0
    }
    if (ts.isJsxExpression(child)) {
      return Boolean(child.expression)
    }
    return true
  })
}

function makeExampleShapeKey(snippet: string): string {
  return snippet
    .replace(/\{[^}]*\}/g, '{expr}')
    .replace(/"[^"]*"/g, '"str"')
    .replace(/\s+/g, ' ')
    .trim()
}