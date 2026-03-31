import * as ts from 'typescript'

import type { AtlasDiagnostic } from './types'
import type { AnalysisContext, ParsedFile } from './project'
import {
  type ComponentTemplate,
  createComponentTemplate,
  getParameterTypeName,
  hasNamedTypeReference,
  isComponentName,
} from './resolution'

export function discoverLocalComponents(
  context: AnalysisContext,
  diagnostics: AtlasDiagnostic[]
): ComponentTemplate[] {
  const components: ComponentTemplate[] = []

  for (const file of context.rootFiles) {
    for (const statement of file.sourceFile.statements) {
      if (!isExportedNode(statement)) {
        continue
      }

      if (
        ts.isFunctionDeclaration(statement) &&
        statement.name &&
        isComponentName(statement.name.text)
      ) {
        const template = createTemplateFromFunction(statement, file, context, diagnostics)
        if (template) {
          components.push(template)
        }
      }

      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (
            !ts.isIdentifier(declaration.name) ||
            !isComponentName(declaration.name.text)
          ) {
            continue
          }

          const template = createTemplateFromVariable(
            declaration,
            file,
            context,
            diagnostics
          )
          if (template) {
            components.push(template)
          }
        }
      }
    }
  }

  return components
}

export function discoverIncludedLibraryComponents(
  context: AnalysisContext,
  includePackages: string[],
  includeSelectors: Array<{ source: string; name: string }>,
  diagnostics: AtlasDiagnostic[]
): ComponentTemplate[] {
  const components: ComponentTemplate[] = []
  const packageNames = new Set([
    ...includePackages,
    ...includeSelectors.map(selector => selector.source),
  ])

  for (const packageName of packageNames) {
    const project = context.packageProjects.get(packageName)
    if (!project || project.files.length === 0) {
      diagnostics.push({
        code: 'unresolved-include-package',
        message: `Atlas could not resolve an includable package project for ${packageName}.`,
        source: packageName,
      })
      continue
    }

    const selectors = includeSelectors.filter(selector => selector.source === packageName)
    for (const file of project.files) {
      for (const statement of file.sourceFile.statements) {
        if (!isExportedNode(statement)) {
          continue
        }

        if (
          ts.isFunctionDeclaration(statement) &&
          statement.name &&
          isComponentName(statement.name.text)
        ) {
          if (
            selectors.length > 0 &&
            !selectors.some(selector => selector.name === statement.name.text)
          ) {
            continue
          }

          const template = createTemplateFromFunction(
            statement,
            file,
            context,
            diagnostics,
            packageName
          )
          if (template) {
            components.push({ ...template, source: packageName })
          }
        }
      }
    }
  }

  return components
}

function createTemplateFromFunction(
  declaration: ts.FunctionDeclaration,
  file: ParsedFile,
  context: AnalysisContext,
  diagnostics: AtlasDiagnostic[],
  forcedSource?: string
): ComponentTemplate | undefined {
  const propsTypeName = getParameterTypeName(declaration.parameters[0])
  if (!propsTypeName) {
    pushUnsupportedPropsDiagnostic(
      diagnostics,
      declaration.name?.text ?? 'AnonymousComponent',
      forcedSource ?? file.path,
      declaration.parameters[0]
    )
    return undefined
  }

  const result = createComponentTemplate(
    declaration.name?.text ?? 'AnonymousComponent',
    propsTypeName,
    file,
    context,
    forcedSource
  )
  pushUnresolvedPropsDiagnostic(
    diagnostics,
    declaration.name?.text ?? 'AnonymousComponent',
    propsTypeName,
    result.propsResolution.isResolved,
    forcedSource ?? file.path
  )

  return result.template
}

function createTemplateFromVariable(
  declaration: ts.VariableDeclaration,
  file: ParsedFile,
  context: AnalysisContext,
  diagnostics: AtlasDiagnostic[]
): ComponentTemplate | undefined {
  if (!ts.isIdentifier(declaration.name)) {
    return undefined
  }
  if (!declaration.initializer || !ts.isArrowFunction(declaration.initializer)) {
    return undefined
  }

  const propsTypeName = getParameterTypeName(declaration.initializer.parameters[0])
  if (!propsTypeName) {
    pushUnsupportedPropsDiagnostic(
      diagnostics,
      declaration.name.text,
      file.path,
      declaration.initializer.parameters[0]
    )
    return undefined
  }

  const result = createComponentTemplate(
    declaration.name.text,
    propsTypeName,
    file,
    context
  )
  pushUnresolvedPropsDiagnostic(
    diagnostics,
    declaration.name.text,
    propsTypeName,
    result.propsResolution.isResolved,
    file.path
  )

  return result.template
}

function isExportedNode(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false
  }

  return Boolean(
    ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
  )
}

function pushUnresolvedPropsDiagnostic(
  diagnostics: AtlasDiagnostic[],
  componentName: string,
  interfaceName: string,
  isResolved: boolean,
  source: string
): void {
  if (isResolved) {
    return
  }

  diagnostics.push({
    code: 'unresolved-props-type',
    message: `Atlas found ${componentName} but could not resolve its props type ${interfaceName}.`,
    source,
    componentName,
    interfaceName,
  })
}

function pushUnsupportedPropsDiagnostic(
  diagnostics: AtlasDiagnostic[],
  componentName: string,
  source: string,
  parameter: ts.ParameterDeclaration | undefined
): void {
  if (!parameter?.type || hasNamedTypeReference(parameter)) {
    return
  }

  diagnostics.push({
    code: 'unsupported-props-annotation',
    message: `Atlas found ${componentName} but only supports named props type references on the first parameter.`,
    source,
    componentName,
  })
}
