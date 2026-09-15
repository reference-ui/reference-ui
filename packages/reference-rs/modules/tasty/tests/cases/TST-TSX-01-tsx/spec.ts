/**
 * Station specification for TST-TSX-01-tsx.
 * Verifies symbol loading from TSX source files and optional member detection.
 * Proves primary SPEC ID anchor TST-TSX-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-TSX-01',
  async verify({ api }) {
    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const buttonVariant = await api.loadSymbolByName('ButtonVariant')

    expect(findMember(buttonProps, 'label').isOptional()).toBe(false)
    expect(findMember(buttonProps, 'onClick').isOptional()).toBe(true)
    expect(findMember(buttonProps, 'disabled').isOptional()).toBe(true)
    expect(buttonVariant.getKind()).toBe('typeAlias')
    expect(buttonVariant.getUnderlyingType()?.getKind()).toBe('union')
  },
}

export default spec
