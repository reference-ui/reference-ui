/**
 * Reference heading level: the outline level of the document title. The
 * view provides it from the `headingLevel` prop and the header reads it,
 * so the title nests under the host page's headings; the level changes
 * the element only, never the title's size.
 */
import * as React from 'react'
import { H2, H3, H4, H5, H6 } from '@reference-ui/react'

export type ReferenceHeadingLevel = 2 | 3 | 4 | 5 | 6

const ReferenceHeadingLevelContext = React.createContext<ReferenceHeadingLevel>(2)

export const ReferenceHeadingLevelProvider = ReferenceHeadingLevelContext.Provider

const HEADINGS = { 2: H2, 3: H3, 4: H4, 5: H5, 6: H6 } as const

/** The heading primitive for the ambient level (`H2` outside a provider). */
export function useReferenceHeading() {
  return HEADINGS[React.useContext(ReferenceHeadingLevelContext)]
}
