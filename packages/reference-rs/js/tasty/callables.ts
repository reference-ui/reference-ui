import type { TastyTypeRef } from './api-types'

export function getTastyCallableParameters(
  type: TastyTypeRef | undefined,
): Array<{ name: string; type?: string; optional?: boolean }> {
  if (!type) return []
  if (type.getKind() !== 'function' && type.getKind() !== 'constructor') return []

  return type.getParameters().map((param, index) => {
    const name = param.getName() ?? `arg${index + 1}`
    return {
      name,
      type: param.getType()?.describe(),
      optional: param.isOptional(),
    }
  })
}
