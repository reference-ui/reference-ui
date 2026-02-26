/**
 * Port allocation and tracking.
 * Prevents conflicts in parallel tests.
 */

import getPort from 'get-port'

/** Allocate an available port */
export async function allocatePort(): Promise<number> {
  return getPort()
}
