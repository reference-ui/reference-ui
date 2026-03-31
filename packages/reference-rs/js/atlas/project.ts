import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import * as ts from 'typescript'

import type { AtlasConfig } from './types'

export type ImportBinding = {
  importedName: string
  source: string
}

export type ExportBinding = {
  exportedName: string
  localName: string
  source?: string
}

export type ParsedFile = {
  path: string
  content: string
  sourceFile: ts.SourceFile
  imports: Map<string, ImportBinding>
  exports: Map<string, ExportBinding>
  typeAliases: Map<string, ts.TypeAliasDeclaration>
  interfaces: Map<string, ts.InterfaceDeclaration>
}

export type PackageProject = {
  packageName: string
  rootDir: string
  files: ParsedFile[]
  filesByPath: Map<string, ParsedFile>
}

export type AnalysisContext = {
  rootSrcDir: string
  rootFiles: ParsedFile[]
  filesByPath: Map<string, ParsedFile>
  packageProjects: Map<string, PackageProject>
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

export async function buildAnalysisContext(
  rootDir: string,
  config?: AtlasConfig
): Promise<AnalysisContext> {
  const rootFiles = await readProjectFiles(rootDir)
  const filesByPath = new Map(rootFiles.map(file => [file.path, file]))
  const packageProjects = new Map<string, PackageProject>()
  const requestedPackages = new Set<string>()

  for (const includePattern of config?.include ?? []) {
    if (isPackagePattern(includePattern)) {
      requestedPackages.add(includePattern)
    }
    if (includePattern.includes(':')) {
      requestedPackages.add(includePattern.split(':')[0])
    }
  }

  for (const file of rootFiles) {
    for (const binding of file.imports.values()) {
      if (!binding.source.startsWith('.')) {
        requestedPackages.add(binding.source)
      }
    }
  }

  for (const packageName of requestedPackages) {
    const packageRoot = resolvePackageRoot(rootDir, packageName)
    const files = await readProjectFiles(packageRoot)
    packageProjects.set(packageName, {
      packageName,
      rootDir: packageRoot,
      files,
      filesByPath: new Map(files.map(file => [file.path, file])),
    })
  }

  return {
    rootSrcDir: path.join(rootDir, 'src'),
    rootFiles,
    filesByPath,
    packageProjects,
  }
}

export async function readProjectFiles(rootDir: string): Promise<ParsedFile[]> {
  const files = await walkSourceFiles(path.join(rootDir, 'src'))
  const parsed: ParsedFile[] = []

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8')
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
    )

    parsed.push({
      path: filePath,
      content,
      sourceFile,
      imports: collectImports(sourceFile),
      exports: collectExports(sourceFile),
      typeAliases: collectTypeAliases(sourceFile),
      interfaces: collectInterfaces(sourceFile),
    })
  }

  return parsed
}

export function getLocalSourcePath(rootSrcDir: string, filePath: string): string {
  return `./${path.relative(rootSrcDir, filePath).replace(/\\/g, '/')}`
}

export function isPackagePattern(pattern: string): boolean {
  return pattern.startsWith('@') && !pattern.includes(':')
}

export function resolveRelativeSourcePath(fromFile: string, specifier: string): string {
  return path.resolve(path.dirname(fromFile), specifier)
}

export function resolveRelativeProjectFile(
  fromFile: string,
  specifier: string,
  filesByPath: Map<string, ParsedFile>
): ParsedFile | undefined {
  const resolved = resolveRelativeSourcePath(fromFile, specifier)

  return (
    filesByPath.get(`${resolved}.ts`) ??
    filesByPath.get(`${resolved}.tsx`) ??
    filesByPath.get(`${resolved}.js`) ??
    filesByPath.get(`${resolved}.jsx`) ??
    filesByPath.get(path.join(resolved, 'index.ts')) ??
    filesByPath.get(path.join(resolved, 'index.tsx')) ??
    filesByPath.get(path.join(resolved, 'index.js')) ??
    filesByPath.get(path.join(resolved, 'index.jsx'))
  )
}

export function resolveProjectExport(
  fromFile: string,
  specifier: string,
  importedName: string,
  filesByPath: Map<string, ParsedFile>,
  seen = new Set<string>()
): { file: ParsedFile; exportedName: string } | undefined {
  const target = resolveRelativeProjectFile(fromFile, specifier, filesByPath)
  if (!target) {
    return undefined
  }

  const seenKey = `${target.path}:${importedName}`
  if (seen.has(seenKey)) {
    return undefined
  }
  seen.add(seenKey)

  const binding = target.exports.get(importedName)
  if (!binding) {
    return { file: target, exportedName: importedName }
  }

  if (!binding.source) {
    return { file: target, exportedName: binding.localName }
  }

  if (!binding.source.startsWith('.')) {
    return { file: target, exportedName: binding.localName }
  }

  return resolveProjectExport(
    target.path,
    binding.source,
    binding.localName,
    filesByPath,
    seen
  )
}

function resolvePackageRoot(rootDir: string, packageName: string): string {
  if (packageName.startsWith('@fixtures/')) {
    return path.resolve(rootDir, '..', packageName.replace('@fixtures/', ''))
  }

  return path.resolve(rootDir, 'node_modules', packageName)
}

async function walkSourceFiles(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkSourceFiles(fullPath)))
      continue
    }
    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function collectImports(sourceFile: ts.SourceFile): Map<string, ImportBinding> {
  const imports = new Map<string, ImportBinding>()

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) {
      continue
    }

    const moduleSpecifier = getStringLiteralText(statement.moduleSpecifier)
    if (!moduleSpecifier) {
      continue
    }

    if (statement.importClause.name) {
      imports.set(statement.importClause.name.text, {
        importedName: 'default',
        source: moduleSpecifier,
      })
    }

    const namedBindings = statement.importClause.namedBindings
    if (!namedBindings) {
      continue
    }

    if (ts.isNamespaceImport(namedBindings)) {
      imports.set(namedBindings.name.text, {
        importedName: '*',
        source: moduleSpecifier,
      })
      continue
    }

    for (const element of namedBindings.elements) {
      imports.set(element.name.text, {
        importedName: (element.propertyName ?? element.name).text,
        source: moduleSpecifier,
      })
    }
  }

  return imports
}

function collectExports(sourceFile: ts.SourceFile): Map<string, ExportBinding> {
  const exports = new Map<string, ExportBinding>()

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const moduleSpecifier =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : undefined

      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          exports.set(element.name.text, {
            exportedName: element.name.text,
            localName: (element.propertyName ?? element.name).text,
            source: moduleSpecifier,
          })
        }
      }
      continue
    }

    if (!isExportedNode(statement)) {
      continue
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      exports.set(statement.name.text, {
        exportedName: statement.name.text,
        localName: statement.name.text,
      })

      if (hasDefaultModifier(statement)) {
        exports.set('default', {
          exportedName: 'default',
          localName: statement.name.text,
        })
      }
      continue
    }

    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      exports.set(statement.name.text, {
        exportedName: statement.name.text,
        localName: statement.name.text,
      })
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue
        }

        exports.set(declaration.name.text, {
          exportedName: declaration.name.text,
          localName: declaration.name.text,
        })

        if (hasDefaultModifier(statement)) {
          exports.set('default', {
            exportedName: 'default',
            localName: declaration.name.text,
          })
        }
      }
    }
  }

  return exports
}

function collectTypeAliases(
  sourceFile: ts.SourceFile
): Map<string, ts.TypeAliasDeclaration> {
  const aliases = new Map<string, ts.TypeAliasDeclaration>()

  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      aliases.set(statement.name.text, statement)
    }
  }

  return aliases
}

function collectInterfaces(
  sourceFile: ts.SourceFile
): Map<string, ts.InterfaceDeclaration> {
  const interfaces = new Map<string, ts.InterfaceDeclaration>()

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      interfaces.set(statement.name.text, statement)
    }
  }

  return interfaces
}

function getStringLiteralText(node: ts.Expression): string | undefined {
  return ts.isStringLiteral(node) ? node.text : undefined
}

function isExportedNode(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false
  }

  return Boolean(
    ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
  )
}

function hasDefaultModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false
  }

  return Boolean(
    ts
      .getModifiers(node)
      ?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
  )
}
