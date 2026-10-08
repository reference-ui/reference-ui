import { Div } from '@reference-ui/react'

// Fully dynamic identifiers still warn and mint nothing: fail-closed stands.
export const d = <Div borderBottomColor={unknownToken} />
