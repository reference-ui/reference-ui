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
  root?: string // baked @layer root default; downstream DROPS, hoists its own
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
 * One named node of a system's fragment list. A published system lists its
 * nodes upstream first and its own last, each name once, so a shared base is
 * one node wherever it is reached from.
 */
export interface FragmentNode {
  name: string
  /** One fragment bundle: IIFEs, each semicolon-prefixed, as the evaluator wraps them. */
  bundle: string
}

/**
 * Portable design-system artefact emitted by sync.
 * Neo-owned copy of the core BaseSystem shape (name plus fragment payload).
 */
export interface BaseSystem {
  name: string
  /** Bundled fragment IIFEs representing the full upstream config contribution: the nodes' bundles in order. */
  fragment: string
  /** Named fragment nodes, upstream first and own last. Absent on a legacy entry, which reads as one opaque node. */
  fragments?: FragmentNode[]
  /** Published structured stylesheet: transitively expanded,
      merge-ordered systems, own entry last. Replaces `css`. */
  streams?: SystemStreams[]
  /** Resolved non-primitive JSX elements contributed by this system and its upstream extends chain. */
  jsxElements?: string[]
  /**
   * Prop names a component keeps for itself, by component name (`{ Tile: ['size'] }`): a call site reads
   * them as the component's own props, never as style props. Sorted and unique, set only when non-empty,
   * and carried through extends and layers alike. A key need not appear in `jsxElements`.
   */
  jsxOwned?: Record<string, string[]>
}

/**
 * The config surface the roster join reads: upstream extends and layers plus
 * the local escape hatch. Layers feed only the owned prop map; the roster
 * names come from extends. ReferenceUIConfig satisfies it structurally, so the
 * join takes this instead of the config type and no config↔base cycle forms.
 */
export interface ExtendsCarrier {
  extends?: BaseSystem[]
  layers?: BaseSystem[]
  jsxElements?: string[]
}

/**
 * The narrow input the published-system assembler maps: identity, the portable
 * fragment bundle, the published structured stylesheet, the merged roster, and
 * the owned prop names. The leg projects this from the publish input at the
 * call, so assembly never imports packager types.
 */
export interface BaseAssemblyInput {
  name: string
  fragment: string
  fragments?: FragmentNode[]
  streams?: SystemStreams[]
  jsxElements: string[]
  jsxOwned?: Record<string, string[]>
}
