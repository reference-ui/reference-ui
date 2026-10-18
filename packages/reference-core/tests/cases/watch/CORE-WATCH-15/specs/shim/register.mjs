// Loader registration for the CORE-WATCH-15 child process. It takes nothing and emits a module hook that swaps @parcel/watcher for the hold shim.
// The spawned watch loads it with node's --import flag, so every module the watch imports resolves through the hook.
import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)
