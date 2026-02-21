export type {
  VirtualOptions,
  FileChangeEvent,
  FileChangeHandler,
  InitVirtualOptions,
} from './types'

export { initVirtual } from './init'
export { syncVirtual } from './sync'
export { transformFile } from './transform'
export { copyToVirtual, removeFromVirtual } from './copy'
export { setupWatcher } from './watcher'
