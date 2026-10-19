/**
 * Namespace import of the same third-party primitive (plan probe 5). A member
 * tag never matched the host roster; its root's import lands in the fixture's
 * directory, so its `color` backs under the fixture's published system,
 * `primitive-named-library`, which the app composes in `extends`.
 */

import * as React from 'react'
import * as Acme from '@fixtures/primitive-named-library'

export function NamespaceButtonProbe(): React.ReactElement {
  return (
    <Acme.Button data-testid="t18-namespace-button" color="t18NamespaceInk">
      namespaced primitive
    </Acme.Button>
  )
}
