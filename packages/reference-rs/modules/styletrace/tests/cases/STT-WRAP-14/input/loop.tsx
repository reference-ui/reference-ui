/**
 * Test file.
 * A component whose props pass StyleProps through two aliases that name each other.
 * It inputs one mutually recursive pair and emits one traced component, with no limit warning.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Ping = Pong & StyleProps
type Pong = Ping & { tone?: string }

export function Looped(props: Ping) {
  return <Div {...props} />
}
