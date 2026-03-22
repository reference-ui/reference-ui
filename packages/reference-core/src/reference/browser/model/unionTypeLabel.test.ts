import { describe, expect, it } from 'vitest'

import { createTastyApi } from '@reference-ui/rust/tasty'

import { createReferenceDocument } from './document'

const manifestPath = new URL(
  '../../../../../reference-rs/tests/tasty/cases/jsdoc/output/manifest.js',
  import.meta.url,
).pathname

describe('union display type label', () => {
  it('shows Union for inline literal unions and the alias name for named references', async () => {
    const api = createTastyApi({ manifestPath })
    const [buttonProps, buttonPropsNamedSize] = await Promise.all([
      api.loadSymbolByName('ButtonProps'),
      api.loadSymbolByName('ButtonPropsNamedSize'),
    ])

    const buttonMembers = await api.graph.getEffectiveMembers(buttonProps)
    const namedMembers = await api.graph.getEffectiveMembers(buttonPropsNamedSize)

    const buttonDoc = createReferenceDocument(buttonProps, buttonMembers, [], [], [])
    const namedDoc = createReferenceDocument(buttonPropsNamedSize, namedMembers, [], [], [])

    expect(buttonDoc.members.find((m) => m.name === 'size')?.typeLabel).toBe('Union')
    expect(namedDoc.members.find((m) => m.name === 'size')?.typeLabel).toBe('NamedButtonSize')
  })
})
