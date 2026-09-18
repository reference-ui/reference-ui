import { OverlayContent } from '@reference-ui/react'

// Member tag matching its concatenated host: extracts.
export const a = <Overlay.Content minW="40r" bg="red" />

// Member tag with no configured host: stays silent.
export const b = <Accordion.Content p="4r" />

void OverlayContent
