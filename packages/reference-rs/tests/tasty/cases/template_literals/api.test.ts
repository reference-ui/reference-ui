import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  describeCaseSymbol,
  findMember,
} from '../../api-test-helpers'

describe('template_literals tasty api', () => {
  addCaseEmittedSnapshotTests('template_literals')

  describeCaseSymbol('template_literals', 'SizeVariant', ({ api }) => {
    it('surfaces template literal parts through alias and member wrappers', async () => {
      const sizeVariant = await api.loadSymbolByName('SizeVariant')
      const tokenKeyLabel = await api.loadSymbolByName('TokenKeyLabel')
      const withTemplateLiterals = await api.loadSymbolByName('WithTemplateLiterals')

      const sizeVariantRaw = sizeVariant.getUnderlyingType()?.getRaw() as {
        kind?: string
        parts?: Array<{ kind?: string; value?: unknown }>
      }
      expect(sizeVariantRaw.kind).toBe('template_literal')
      expect(sizeVariantRaw.parts?.[0]).toEqual({ kind: 'text', value: 'size-' })
      expect(sizeVariantRaw.parts?.[1]?.kind).toBe('type')

      const tokenLabelRaw = tokenKeyLabel.getUnderlyingType()?.getRaw() as {
        parts?: Array<{ kind?: string; value?: { kind?: string; operator?: string; target?: { name?: string } } }>
      }
      expect(tokenLabelRaw.parts?.[1]?.value?.kind).toBe('type_operator')
      expect(tokenLabelRaw.parts?.[1]?.value?.operator).toBe('keyof')
      expect(tokenLabelRaw.parts?.[1]?.value?.target?.name).toBe('Tokens')

      const labelType = findMember(withTemplateLiterals, 'label').getType()?.getRaw() as {
        kind?: string
        parts?: Array<{ kind?: string; value?: { kind?: string; operator?: string } }>
      }
      expect(labelType.kind).toBe('template_literal')
      expect(labelType.parts?.[1]?.value?.kind).toBe('type_operator')
      expect(labelType.parts?.[1]?.value?.operator).toBe('keyof')
    })
  })
})
