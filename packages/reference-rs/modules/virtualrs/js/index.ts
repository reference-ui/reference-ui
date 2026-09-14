/**
 * TypeScript API entrypoint for the VirtualRS AST transformation module.
 * Re-exports native rewrite functions and TypeScript type definitions for consumer modules.
 * Exposes CSS remapping, function identifier substitution, and responsive style compilation.
 */
export {
  applyResponsiveStyles,
  replaceFunctionName,
  rewriteCssImports,
  rewriteCvaImports,
  type VirtualrsNative,
} from './runtime'
