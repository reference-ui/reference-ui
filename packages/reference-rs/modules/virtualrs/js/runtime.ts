/**
 * Native Node-API ABI bindings and invocation helpers for VirtualRS transforms.
 * Defines exported symbol manifests and interfaces for AST rewriting passes.
 * Exposes rewrite routines for CSS imports, CVA imports, function identifiers, and responsive styles.
 * Translates TypeScript source buffers and options directly across the native barrier.
 */
import { requireNative } from '../../runtime/js/native'

export const VIRTUALRS_NATIVE_EXPORTS = [
  'rewriteCssImports',
  'rewriteCvaImports',
  'replaceFunctionName',
  'applyResponsiveStyles',
] as const

export interface VirtualrsNative {
  rewriteCssImports(sourceCode: string, relativePath: string): string
  rewriteCvaImports(sourceCode: string, relativePath: string): string
  replaceFunctionName(
    sourceCode: string,
    relativePath: string,
    fromName: string,
    toName: string,
    importFrom?: string
  ): string
  applyResponsiveStyles(
    sourceCode: string,
    relativePath: string,
    breakpointsJson?: string
  ): string
}

export function rewriteCssImports(sourceCode: string, relativePath: string): string {
  const native = requireNative<VirtualrsNative>('rewrite CSS imports')

  return native.rewriteCssImports(sourceCode, relativePath)
}

export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
  const native = requireNative<VirtualrsNative>('rewrite CVA imports')

  return native.rewriteCvaImports(sourceCode, relativePath)
}

export function replaceFunctionName(
  sourceCode: string,
  relativePath: string,
  fromName: string,
  toName: string,
  importFrom?: string
): string {
  const native = requireNative<VirtualrsNative>('replace function names')

  return native.replaceFunctionName(
    sourceCode,
    relativePath,
    fromName,
    toName,
    importFrom
  )
}

export function applyResponsiveStyles(
  sourceCode: string,
  relativePath: string,
  breakpoints?: Record<string, string>
): string {
  const native = requireNative<VirtualrsNative>('apply responsive styles')

  const breakpointsJson =
    breakpoints && Object.keys(breakpoints).length > 0
      ? JSON.stringify(breakpoints)
      : undefined

  return native.applyResponsiveStyles(sourceCode, relativePath, breakpointsJson)
}
