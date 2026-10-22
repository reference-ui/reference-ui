// Component module for the SYNC-18 world: a file in include that imports getRhythm from @reference-ui/system. Takes
// nothing and emits gapStyle, the padding a Gap component would apply, so sync must resolve the import too.
import { getRhythm } from '@reference-ui/system'

export const gapStyle = { padding: getRhythm(3) }
