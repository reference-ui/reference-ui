// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/components/Reference/fixtures/SimpleTypeApiReference.book.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Reference } from '../index'

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
