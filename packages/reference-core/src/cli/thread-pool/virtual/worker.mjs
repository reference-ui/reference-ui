/**
 * Worker entry point - simply re-exports the work function.
 * BroadcastChannel in event-bus handles all cross-thread communication automatically.
 */

export { runVirtual as default } from '../../../virtual/init.js'
