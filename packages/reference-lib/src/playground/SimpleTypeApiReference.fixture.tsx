import { Reference } from '../Reference/index.js'

/**
 * Simple literal-union type used to pin the definition-first "Type" surface.
 */
export type DocsReferenceSimpleType = 'a' | 'b'

/**
 * Internal object shape used to verify that direct aliasing remains a public
 * boundary in docs instead of automatically expanding to the target members.
 */
export interface DocsReferencePinnedTarget {
  label: string
  disabled?: boolean
}

export type DocsReferencePinnedTargetAlias = DocsReferencePinnedTarget

export default <Reference name="DocsReferenceSimpleType" />
