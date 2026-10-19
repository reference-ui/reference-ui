/**
 * Dismiss-module barrel: containment plus listener sync, nothing else.
 * Ships `isInsideLayer` for inside/outside verdicts and
 * `syncDismissListeners` for document binding, keeping the rest private.
 */
export { isInsideLayer } from './inside'
export { syncDismissListeners } from './listeners'
