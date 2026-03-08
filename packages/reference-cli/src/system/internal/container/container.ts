/**
 * Container query prop: set up container context for the box pattern.
 */

import { extendPattern } from '../../api/patterns'

export interface ContainerProp {
  container?: string | boolean
}

extendPattern({
  properties: {
    container: { type: 'string' },
  },
  transform(props: Record<string, unknown>) {
    const { container } = props

    if (container === undefined) return {}

    return {
      containerType: 'inline-size',
      ...(typeof container === 'string' && container && { containerName: container }),
    }
  },
})
