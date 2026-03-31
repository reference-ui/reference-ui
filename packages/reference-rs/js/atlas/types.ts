/**
 * How widely something is used relative to everything else Atlas has observed.
 * Applies to components, props, and discrete prop values.
 */
export type Usage = 'very common' | 'common' | 'occasional' | 'rare' | 'unused'

export type AtlasDiagnosticCode =
  | 'unresolved-props-type'
  | 'unsupported-props-annotation'
  | 'unresolved-include-package'

export type AtlasDiagnostic = {
  code: AtlasDiagnosticCode
  message: string
  source: string
  componentName?: string
  interfaceName?: string
}

export type AtlasAnalysisResult = {
  components: Component[]
  diagnostics: AtlasDiagnostic[]
}

/**
 * The TypeScript interface (or type alias) that describes a component's props,
 * paired with where that type is declared.
 *
 * Atlas discovers this by tracing the component's props parameter back to its
 * type declaration. Tasty consumes it to resolve the full member list, JSDoc,
 * defaults, and optionality — none of which Atlas needs to carry itself.
 *
 * Examples:
 *   { name: 'ButtonProps',  source: '@fixtures/demo-ui' }   — library type
 *   { name: 'AppCardProps', source: './src/components/AppCard.tsx' }  — local type
 *   { name: 'BadgeProps',   source: '@fixtures/demo-ui' }   — re-used library type
 */
export type ComponentInterface = {
  /** The TypeScript interface or type alias name. */
  name: string
  /**
   * Where the type is declared — package name or absolute/relative file path.
   * Matches the same format as Component.source.
   */
  source: string
}

export type ComponentProp = {
  name: string
  count: number
  usage: Usage
  /**
   * Only present when the prop has a finite set of meaningful values — unions,
   * enums, string literals. Omitted for plain string, boolean, number etc.
   * Each entry is a possible value from the type paired with how often it
   * actually appears in this codebase.
   */
  values?: Record<string, Usage>
}

export type Component = {
  name: string
  /**
   * The TypeScript props interface for this component.
   * Pass to Tasty to resolve member details (descriptions, defaults, optionality).
   */
  interface: ComponentInterface
  /** Import source — package name or local path */
  source: string
  count: number
  props: ComponentProp[]
  usage: Usage
  /**
   * Representative call-site snippets, deduplicated by prop shape. Each entry
   * is the JSX element itself — not its children or the surrounding tree.
   * Capped to a small number to stay token-safe.
   */
  examples: string[]
  /**
   * Other components this one commonly appears alongside, with relative
   * frequency. Surfaces "constellations" — e.g. Breadcrumbs almost always
   * appears with PageHeader in this repo.
   */
  usedWith: Record<string, Usage>
}

export type AtlasConfig = {
  /**
   * What Atlas should track. Accepts:
   * - package names: `"@acme/ui"`
   * - glob paths: `"src/components/**"`, `"packages/ui/src/**"`
   * - component selectors (future): `"@acme/ui:Button"`
   *
   * Local project files are always tracked. Omit or leave empty to track
   * only local components.
   */
  include?: string[]
  /**
   * Components, props, or values to suppress from tracking.
   * Accepts the same formats as `include`.
   * Component selectors (e.g. `"@acme/ui:Button"`) are not yet implemented.
   */
  exclude?: string[]
}
