// Consumer type probe for the @reference-ui/lib/baseSystem subpath.
// It takes the published `types` condition and emits a type alias, so the
// smoke's tsc pass fails if the exports map ever stops resolving the subpath.
// Runtime resolution is asserted separately by scripts/consumer-smoke/run.mjs.

import { baseSystem } from '@reference-ui/lib/baseSystem'

export type PublishedBaseSystem = typeof baseSystem
