import { Div, NSPanel, LatePanel } from '@reference-ui/react'

// Bound member root resolving through its const object literal: extracts.
const NS = { Panel: Div }
const Other = { Panel: Div }

export const a = <NS.Panel minW="40r" bg="red" />

// Same-file twin with no configured host: stays silent.
export const b = <Other.Panel p="4r" />

// Declaration order never matters: use-before-declare resolves the same.
export const c = <Late.Panel mt="2r" />
const Late = { Panel: Div }

void NSPanel
void LatePanel
