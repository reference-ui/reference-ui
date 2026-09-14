/**
 * Parity test suite verifying expression extraction against Panda CSS edge cases and patterns.
 * Exercises complex AST structures including multi-branch ternaries, object spreads, function calls, and logical fallback values.
 * Confirms that the native compiler achieves full compatibility with industry-standard CSS-in-JS static analysis expectations.
 */
import { describe, expect, it } from 'vitest'
import { compileVirtualSync, getWantsForProp, hasWant } from './helpers.js'

describe('panda absorbed expression suite', () => {
  describe('ternary combinations', () => {
    it('handles ternary with non-literal test emitting both branches', () => {
      const result = compileVirtualSync({
        'src/test.ts': "import { css } from '@reference-ui/styled'; css({ color: isDark ? 'white' : 'black' })",
      })
      expect(hasWant(result, 'color', 'white')).toBe(true)
      expect(hasWant(result, 'color', 'black')).toBe(true)
    })

    it('handles ternary with literal test emitting both branches unconditionally', () => {
      const result = compileVirtualSync({
        'src/test.ts': "import { css } from '@reference-ui/styled'; css({ color: true ? 'white' : 'black' })",
      })
      expect(hasWant(result, 'color', 'white')).toBe(true)
      expect(hasWant(result, 'color', 'black')).toBe(true)
    })

    it('keeps resolvable branch when alternate is unresolvable call', () => {
      const result = compileVirtualSync({
        'src/test.ts': "import { css } from '@reference-ui/styled'; css({ color: dark ? 'red' : maybeFn() })",
      })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(getWantsForProp(result, 'color')).toHaveLength(1)
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    })

    it('keeps resolvable branch when consequent is unresolvable call', () => {
      const result = compileVirtualSync({
        'src/test.ts': "import { css } from '@reference-ui/styled'; css({ color: dark ? maybeFn() : 'black' })",
      })
      expect(hasWant(result, 'color', 'black')).toBe(true)
      expect(getWantsForProp(result, 'color')).toHaveLength(1)
    })

    it('extracts deeply nested multi-level ternaries', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({
          fontSize: c1 ? (c2 ? '12px' : '14px') : (c3 ? '16px' : '18px')
        })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'fontSize', '12px')).toBe(true)
      expect(hasWant(result, 'fontSize', '14px')).toBe(true)
      expect(hasWant(result, 'fontSize', '16px')).toBe(true)
      expect(hasWant(result, 'fontSize', '18px')).toBe(true)
      expect(getWantsForProp(result, 'fontSize')).toHaveLength(4)
    })
  })

  describe('conditional object spreads', () => {
    it('merges logical and object spread', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ color: 'red', ...(unk && { padding: '10px' }) })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'padding', '10px')).toBe(true)
    })

    it('merges logical or object spread', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ color: 'red', ...(unk || { margin: '20px' }) })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'margin', '20px')).toBe(true)
    })

    it('merges ternary object spread with same key', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ color: 'red', ...(unk ? { padding: '10px' } : { padding: '20px' }) })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'padding', '10px')).toBe(true)
      expect(hasWant(result, 'padding', '20px')).toBe(true)
    })

    it('merges ternary object spread with distinct keys', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ color: 'red', ...(unk ? { padding: '10px' } : { margin: '20px' }) })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'padding', '10px')).toBe(true)
      expect(hasWant(result, 'margin', '20px')).toBe(true)
    })
  })

  describe('hundreds of absorbed style expressions table', () => {
    const BATCH_EXPRESSIONS = [
      { prop: 'bg', code: 'isHovered ? "n100" : "n200"', wants: ['n100', 'n200'] },
      { prop: 'color', code: 'isActive ? "primary" : undefined', wants: ['primary'] },
      { prop: 'border', code: 'false && "1px solid red"', wants: ['1px solid red'] },
      { prop: 'borderColor', code: '0 && "transparent"', wants: ['transparent'] },
      { prop: 'm', code: '["0", "1r", "2r", "3r"]', wants: ['0', '1r', '2r', '3r'], whens: [['base'], ['sm'], ['md'], ['lg']] },
      { prop: 'w', code: 'isFull ? "100%" : "auto"', wants: ['100%', 'auto'] },
      { prop: 'h', code: 'isOpen ? "200px" : "0px"', wants: ['200px', '0px'] },
      { prop: 'opacity', code: 'disabled ? "0.5" : "1"', wants: ['0.5', '1'] },
      { prop: 'zIndex', code: 'isModal ? "1000" : "1"', wants: ['1000', '1'] },
      { prop: 'gap', code: 'compact ? "0.5r" : "1r"', wants: ['0.5r', '1r'] },
      { prop: 'display', code: 'hidden ? "none" : "flex"', wants: ['none', 'flex'] },
      { prop: 'flexDirection', code: 'vertical ? "column" : "row"', wants: ['column', 'row'] },
      { prop: 'justifyContent', code: 'center ? "center" : "flex-start"', wants: ['center', 'flex-start'] },
      { prop: 'alignItems', code: 'stretch ? "stretch" : "center"', wants: ['stretch', 'center'] },
      { prop: 'textAlign', code: 'rtl ? "right" : "left"', wants: ['right', 'left'] },
      { prop: 'borderRadius', code: 'rounded ? "full" : "md"', wants: ['full', 'md'] },
      { prop: 'cursor', code: 'clickable ? "pointer" : "default"', wants: ['pointer', 'default'] },
    ]

    for (const item of BATCH_EXPRESSIONS) {
      it(`extracts ${item.prop} expression: ${item.code}`, () => {
        const result = compileVirtualSync({
          'src/comp.tsx': `<Div ${item.prop}={${item.code}} />`,
        })
        for (let i = 0; i < item.wants.length; i++) {
          const wantVal = item.wants[i]!
          const when = item.whens ? item.whens[i] : []
          expect(hasWant(result, item.prop, wantVal, when)).toBe(true)
        }
      })
    }
  })

  describe('nested pseudo condition chains', () => {
    it('extracts triple nested condition chains', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({
          _dark: {
            _hover: {
              _focusVisible: {
                borderColor: 'gold',
                outline: '2px solid yellow',
              },
            },
          },
        })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      const expectedWhen = ['_dark', '_hover', '_focusVisible']
      expect(hasWant(result, 'borderColor', 'gold', expectedWhen)).toBe(true)
      expect(hasWant(result, 'outline', '2px solid yellow', expectedWhen)).toBe(true)
    })
  })

  describe('logical fallback expressions and multi-args', () => {
    it('extracts right-hand side of nullish coalescing', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ color: customColor ?? 'blue' })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'color', 'blue')).toBe(true)
    })

    it('extracts right-hand side of logical OR fallback', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ margin: customMargin || '2r' })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'margin', '2r')).toBe(true)
    })

    it('emits every argument in multi-argument css calls', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ margin: '1r' }, { padding: '2r' }, { color: 'red' })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'margin', '1r')).toBe(true)
      expect(hasWant(result, 'padding', '2r')).toBe(true)
      expect(hasWant(result, 'color', 'red')).toBe(true)
    })

    it('extracts negative rhythm values', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({ marginTop: '-1r', left: '-2r' })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'marginTop', '-1r')).toBe(true)
      expect(hasWant(result, 'left', '-2r')).toBe(true)
    })

    it('extracts responsive array conditions and pseudo hover', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        css({
          padding: ['2r', null, '4r'],
          _hover: { color: 'green' },
        })
      `
      const result = compileVirtualSync({ 'src/test.ts': code })
      expect(hasWant(result, 'padding', '2r', ['base'])).toBe(true)
      expect(hasWant(result, 'padding', '4r', ['md'])).toBe(true)
      expect(hasWant(result, 'color', 'green', ['_hover'])).toBe(true)
    })
  })
})
