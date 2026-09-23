// Contract types for the portable base system.
// It takes nothing and emits the BaseSystem shape plus the narrow structural
// inputs that keep assembly a leaf. Callers satisfy the inputs by shape, so no
// project-side import ever points back at a consumer.

/**
 * Per-layer blocks of ONE system. Served `tokens` rides N-API
 * only; published entries carry `tokensPortable`. Frozen wire
 * truth lives in reference-rs contracts; keep field-identical.
 */
export interface SystemStreams {
  name: string
  preamble: string // verbatim inner prelude (~55 B, drift-proof)
  reset?: string // separable chunk; downstream DROPS, never concats
  global?: string
  tokens?: string // :root-hoisted; N-API own-compile ONLY, never published
  tokensPortable?: string // [data-layer]-scoped; the published variant
  recipes?: string
  utilities?: string
  package?: string // wrap name; empty/absent stays flat
}

/**
 * Portable design-system artefact emitted by sync.
 * Neo-owned copy of the core BaseSystem shape (name plus fragment payload).
 */
export interface BaseSystem {
  name: string
  /** Bundled fragment IIFEs representing the full upstream config contribution. */
  fragment: string
  /** Merged portable CSS: extends stylesheets in declared order plus the own block; the publisher owns the reset. */
  css?: string
  /** Resolved non-primitive JSX elements contributed by this system and its upstream extends chain. */
  jsxElements?: string[]
}

/**
 * The config surface the roster join reads: upstream extends plus the local
 * escape hatch. ReferenceUIConfig satisfies it structurally, so the join takes
 * this instead of the config type and no config↔base cycle forms.
 */
export interface ExtendsCarrier {
  extends?: BaseSystem[]
  jsxElements?: string[]
}

/**
 * The narrow input the published-system assembler maps: identity, the portable
 * fragment bundle, the merged portable sheet, and the merged roster. The leg
 * projects this from the publish input at the call, so assembly never imports
 * packager types.
 */
export interface BaseAssemblyInput {
  name: string
  fragment: string
  css?: string
  jsxElements: string[]
}
