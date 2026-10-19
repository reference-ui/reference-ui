/**
 * Callable parameter extraction for tasty types.
 * Returns the name, described type, and optionality of each parameter, or an empty list when the type is not callable.
 */
import type { TastyTypeRef } from './api-types.js'

export function getTastyCallableParameters(
  type: TastyTypeRef | undefined
): Array<{ name: string; type?: string; optional?: boolean }> {
  if (!type?.isCallable()) return []

  return type.getParameters().map((param, index) => {
    const name = param.getName() ?? `arg${index + 1}`
    return {
      name,
      type: param.getType()?.describe(),
      optional: param.isOptional(),
    }
  })
}
