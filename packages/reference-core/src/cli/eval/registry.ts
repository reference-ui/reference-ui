/**
 * Registry of function names that eval scans for and evaluates.
 * Eval does not know what these functions do; it only finds files that call them
 * and runs those files to collect the results.
 */
export const REGISTERED_FUNCTIONS = ['extendPandaConfig'] as const

export type RegisteredFunction = (typeof REGISTERED_FUNCTIONS)[number]

export function isRegistered(name: string): name is RegisteredFunction {
  return (REGISTERED_FUNCTIONS as readonly string[]).includes(name)
}
