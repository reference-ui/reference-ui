// Sync-time barrel for the @reference-ui/system id, the target of the fragment bootstrap alias.
// It takes nothing and exports exactly the runtime names the generated system entry exports, so a theme or component
// file imports the same surface during sync that it imports after sync. The calls are core's real collectors,
// defineConfig and getRhythm, so theme calls register as they do through @reference-ui/core. The one name that cannot
// run here is baseSystem: the system being built has no published form yet, so reading it throws a named error.

import type { BaseSystem } from '../../system/base/types.ts'

export { defineConfig } from '../../config/types.ts'
export { font, globalCss, keyframes, recipe, tokens } from '../surface/index.ts'
export { getRhythm } from '../../system/base/rhythm.ts'

const THEME_READ_MESSAGE = 'a theme file cannot read the system it is building; import upstream systems in ui.config'

/** A theme file read baseSystem during sync, when the system it builds has no published form to read. */
class ThemeSystemReadError extends Error {
  constructor() {
    super(THEME_READ_MESSAGE)
    this.name = 'ThemeSystemReadError'
  }
}

function refuseRead(): never {
  throw new ThemeSystemReadError()
}

// The import binds and the theme file loads; the first property read, key listing or membership test throws.
const UNREADABLE: ProxyHandler<BaseSystem> = {
  get: refuseRead,
  has: refuseRead,
  ownKeys: refuseRead,
  getOwnPropertyDescriptor: refuseRead,
}

/** baseSystem as a theme file sees it at sync: importable, and unreadable until the system is published. */
export const baseSystem: BaseSystem = new Proxy({} as BaseSystem, UNREADABLE)
