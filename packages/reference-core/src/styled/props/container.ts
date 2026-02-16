/**
 * Container query prop: Set up container context
 */

import { pattern } from '../api/pattern'

// --- Type ---

export type ContainerProp = string | boolean

export interface ContainerPropDefinition {
  container?: ContainerProp
}

// --- Box Pattern Extension ---

pattern({
  properties: {
    container: { type: 'string' as const },
  },
  transform(props: Record<string, any>) {
    const { container } = props

    if (container === undefined) return {}

    return {
      containerType: 'inline-size' as const,
      ...(typeof container === 'string' && container && { containerName: container }),
    }
  },
})
