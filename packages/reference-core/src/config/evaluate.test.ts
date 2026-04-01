import { describe, expect, it } from 'vitest'
import { evaluateConfig } from './evaluate'

describe('evaluateConfig', () => {
  it('loads an in-memory ESM config module', async () => {
    const result = await evaluateConfig(
      'export default { name: "demo", include: ["src/**/*.ts"] }'
    )

    expect(result).toEqual({
      name: 'demo',
      include: ['src/**/*.ts'],
    })
  })

  it('falls back to the module namespace when no default export exists', async () => {
    const result = await evaluateConfig(
      'export const name = "demo"; export const include = ["src/**/*.ts"]'
    )

    expect(result).toMatchObject({
      name: 'demo',
      include: ['src/**/*.ts'],
    })
  })
})
