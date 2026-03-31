import * as ts from 'typescript'

import type { ComponentInterface } from './types'
import {
  type AnalysisContext,
  type PackageProject,
  type ParsedFile,
  getLocalSourcePath,
  resolveProjectExport,
} from './project'

export type PropTemplate = {
  name: string
  values?: string[]
}

export type ComponentTemplate = {
  name: string
  source: string
  interface: ComponentInterface
  props: PropTemplate[]
}

type ResolvedType = {
  props: PropTemplate[]
  values?: string[]
}

export type PropsResolution = {
  isResolved: boolean
  props: PropTemplate[]
}

export function createComponentTemplate(
  componentName: string,
  propsTypeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  forcedSource?: string
): { template: ComponentTemplate; propsResolution: PropsResolution } {
  const propsResolution = resolveTopLevelPropsFromTypeName(
    propsTypeName,
    file,
    context,
    new Set()
  )

  return {
    template: {
      name: componentName,
      source: forcedSource ?? getLocalSourcePath(context.rootSrcDir, file.path),
      interface: resolveInterfaceSource(propsTypeName, file, context, forcedSource),
      props: propsResolution.props,
    },
    propsResolution,
  }
}

export function getParameterTypeName(
  parameter: ts.ParameterDeclaration | undefined
): string | undefined {
  if (!parameter?.type || !ts.isTypeReferenceNode(parameter.type)) {
    return undefined
  }

  return getEntityNameText(parameter.type.typeName)
}

export function hasNamedTypeReference(
  parameter: ts.ParameterDeclaration | undefined
): boolean {
  return Boolean(parameter?.type && ts.isTypeReferenceNode(parameter.type))
}

export function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name)
}

function resolveInterfaceSource(
  typeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  forcedSource?: string
): ComponentInterface {
  if (forcedSource) {
    return { name: typeName, source: forcedSource }
  }

  if (file.typeAliases.has(typeName) || file.interfaces.has(typeName)) {
    return { name: typeName, source: getLocalSourcePath(context.rootSrcDir, file.path) }
  }

  const imported = file.imports.get(typeName)
  if (imported) {
    return { name: typeName, source: imported.source }
  }

  return { name: typeName, source: getLocalSourcePath(context.rootSrcDir, file.path) }
}

function resolveTopLevelPropsFromTypeName(
  typeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): PropsResolution {
  const local = resolveLocalProps(typeName, file, context, seen)
  if (local) {
    return { isResolved: true, props: local }
  }

  const imported = file.imports.get(typeName)
  if (!imported) {
    return { isResolved: false, props: [] }
  }

  if (imported.source.startsWith('.')) {
    const target = resolveProjectExport(
      file.path,
      imported.source,
      imported.importedName,
      context.filesByPath
    )
    if (!target) {
      return { isResolved: false, props: [] }
    }

    return {
      isResolved: true,
      props: resolvePropsFromTypeName(target.exportedName, target.file, context, seen),
    }
  }

  const packageProject = context.packageProjects.get(imported.source)
  if (!packageProject || packageProject.files.length === 0) {
    return { isResolved: false, props: [] }
  }

  return {
    isResolved: true,
    props: resolvePackageProps(imported.importedName, packageProject, context, seen),
  }
}

function resolveLocalProps(
  typeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): PropTemplate[] | undefined {
  const typeAlias = file.typeAliases.get(typeName)
  if (typeAlias) {
    return dedupeProps(resolveTypeNode(typeAlias.type, file, context, seen).props)
  }

  const interfaceDecl = file.interfaces.get(typeName)
  if (interfaceDecl) {
    return dedupeProps(resolveInterfaceDeclaration(interfaceDecl, file, context, seen))
  }

  return undefined
}

function resolvePropsFromTypeName(
  typeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): PropTemplate[] {
  const key = `${file.path}:${typeName}`
  if (seen.has(key)) {
    return []
  }
  seen.add(key)

  const local = resolveLocalProps(typeName, file, context, seen)
  if (local) {
    return local
  }

  const imported = file.imports.get(typeName)
  if (!imported) {
    return []
  }

  if (imported.source.startsWith('.')) {
    const target = resolveProjectExport(
      file.path,
      imported.source,
      imported.importedName,
      context.filesByPath
    )
    return target
      ? resolvePropsFromTypeName(target.exportedName, target.file, context, seen)
      : []
  }

  const packageProject = context.packageProjects.get(imported.source)
  return packageProject
    ? resolvePackageProps(imported.importedName, packageProject, context, seen)
    : []
}

function resolvePackageProps(
  typeName: string,
  packageProject: PackageProject,
  context: AnalysisContext,
  seen: Set<string>
): PropTemplate[] {
  for (const file of packageProject.files) {
    const local = resolveLocalProps(typeName, file, context, seen)
    if (local) {
      return local
    }
  }

  return []
}

function resolveTypeNode(
  node: ts.TypeNode,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): ResolvedType {
  if (ts.isTypeLiteralNode(node)) {
    return { props: extractPropsFromMembers(node.members, file, context, seen) }
  }

  if (ts.isIntersectionTypeNode(node)) {
    return {
      props: dedupeProps(
        node.types.flatMap(typeNode => resolveTypeNode(typeNode, file, context, seen).props)
      ),
    }
  }

  if (ts.isParenthesizedTypeNode(node)) {
    return resolveTypeNode(node.type, file, context, seen)
  }

  if (ts.isUnionTypeNode(node)) {
    return { props: [], values: getLiteralUnionValues(node) }
  }

  if (ts.isTypeReferenceNode(node)) {
    const typeName = getEntityNameText(node.typeName)
    if (!typeName) {
      return { props: [] }
    }

    const props = resolvePropsFromTypeName(typeName, file, context, seen)
    if (props.length > 0) {
      return { props }
    }

    return {
      props: [],
      values: resolveLiteralValuesFromTypeName(typeName, file, context, seen),
    }
  }

  return { props: [] }
}

function resolveInterfaceDeclaration(
  declaration: ts.InterfaceDeclaration,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): PropTemplate[] {
  const inherited =
    declaration.heritageClauses?.flatMap(clause =>
      clause.types.flatMap(typeNode => resolveTypeNode(typeNode, file, context, seen).props)
    ) ?? []

  return dedupeProps([
    ...inherited,
    ...extractPropsFromMembers(declaration.members, file, context, seen),
  ])
}

function extractPropsFromMembers(
  members: ts.NodeArray<ts.TypeElement>,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): PropTemplate[] {
  const props: PropTemplate[] = []

  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.name) {
      continue
    }

    const name = getPropertyNameText(member.name)
    if (!name) {
      continue
    }

    const prop: PropTemplate = { name }
    if (member.type) {
      const values = resolveTypeNode(member.type, file, context, seen).values
      if (values?.length) {
        prop.values = values
      }
    }
    props.push(prop)
  }

  return props
}

function resolveLiteralValuesFromTypeName(
  typeName: string,
  file: ParsedFile,
  context: AnalysisContext,
  seen: Set<string>
): string[] | undefined {
  const key = `${file.path}:values:${typeName}`
  if (seen.has(key)) {
    return undefined
  }
  seen.add(key)

  const typeAlias = file.typeAliases.get(typeName)
  if (typeAlias) {
    return resolveTypeNode(typeAlias.type, file, context, seen).values
  }

  const imported = file.imports.get(typeName)
  if (!imported) {
    return undefined
  }

  if (imported.source.startsWith('.')) {
    const target = resolveProjectExport(
      file.path,
      imported.source,
      imported.importedName,
      context.filesByPath
    )
    return target
      ? resolveLiteralValuesFromTypeName(target.exportedName, target.file, context, seen)
      : undefined
  }

  const packageProject = context.packageProjects.get(imported.source)
  if (!packageProject) {
    return undefined
  }

  for (const packageFile of packageProject.files) {
    const typeAlias = packageFile.typeAliases.get(imported.importedName)
    if (typeAlias) {
      return resolveTypeNode(typeAlias.type, packageFile, context, seen).values
    }
  }

  return undefined
}

function dedupeProps(props: PropTemplate[]): PropTemplate[] {
  const byName = new Map<string, PropTemplate>()

  for (const prop of props) {
    const current = byName.get(prop.name)
    if (!current || (!current.values?.length && prop.values?.length)) {
      byName.set(prop.name, prop)
    }
  }

  return Array.from(byName.values())
}

function getLiteralUnionValues(node: ts.UnionTypeNode): string[] | undefined {
  const values = node.types
    .map(typeNode =>
      ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)
        ? typeNode.literal.text
        : undefined
    )
    .filter((value): value is string => Boolean(value))

  return values.length === node.types.length ? values : undefined
}

function getEntityNameText(name: ts.EntityName): string | undefined {
  return ts.isIdentifier(name) ? name.text : name.right.text
}

function getPropertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text
  }

  return undefined
}