// Component module for the SYNC-19 world, a file under include.
// It imports getRhythm from @reference-ui/system, takes nothing, and emits gapStyle, the padding a Gap component
// would apply, so sync must resolve the import too.
import { getRhythm } from '@reference-ui/system'

export const gapStyle = { padding: getRhythm(3) }
