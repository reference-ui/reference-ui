import * as React from 'react'
import * as Acme from '@fixtures/primitive-named-library'

/**
 * Namespace import of the same third-party primitive (plan probe 5). A member
 * tag never matched the host roster, so this takes the external fan-out today:
 * an unmapped package composed in `extends` is backed under its own name.
 */
export function NamespaceButtonProbe(): React.ReactElement {
  return (
    <Acme.Button data-testid="t18-namespace-button" color="t18NamespaceInk">
      namespaced primitive
    </Acme.Button>
  )
}
