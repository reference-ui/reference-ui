/**
 * Integration test suite for compile-time style expression extraction, ternary flattening, and AST leaf collection.
 * Validates that static JSX attributes, nested conditionals, and logical expressions resolve into expected atomic wants.
 * Ensures the extraction pass captures comprehensive styling permutations while discarding undefined branches and invalid literals.
 */
import { describe, expect, it } from 'vitest'
import { compileVirtual, compileVirtualSync, getWantsForProp, hasWant } from './helpers.js'

describe('system expression extraction', () => {
  describe('flat and nested ternaries', () => {
    it('scoops both branches of flat ternaries without evaluating condition', () => {
      const result = compileVirtualSync({
        'src/Comp.tsx': 'export const Comp = ({ active }) => <Div bg={active ? "n300" : "n100"} />',
      })
      expect(hasWant(result, 'bg', 'n300')).toBe(true)
      expect(hasWant(result, 'bg', 'n100')).toBe(true)
      expect(result.diagnostics).toHaveLength(0)
    })

    it('flattens nested ternaries unconditionally', () => {
      const code = `
        export const Tabs = ({ isLine, horizontal, isSelected }) => (
          <Div
            borderBottom={
              isLine && horizontal
                ? isSelected
                  ? '3px solid'
                  : '3px solid transparent'
                : undefined
            }
          />
        )
      `
      const result = compileVirtualSync({ 'src/Tabs.tsx': code })
      expect(hasWant(result, 'borderBottom', '3px solid')).toBe(true)
      expect(hasWant(result, 'borderBottom', '3px solid transparent')).toBe(true)
      expect(getWantsForProp(result, 'borderBottom')).toHaveLength(2)
      expect(result.diagnostics).toHaveLength(0)
    })

    it('omits undefined and void 0 branches without emitting null leaves', () => {
      const code = `
        export const Comp = ({ a, b }) => (
          <Div
            color={a ? 'red' : undefined}
            bg={b ? void 0 : 'blue'}
          />
        )
      `
      const result = compileVirtualSync({ 'src/Comp.tsx': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'bg', 'blue')).toBe(true)
      expect(getWantsForProp(result, 'color')).toHaveLength(1)
      expect(getWantsForProp(result, 'bg')).toHaveLength(1)
      expect(result.diagnostics).toHaveLength(0)
    })
  })

  describe('logical operator symmetry', () => {
    it('symmetrically collects literal operand from falsy guards', () => {
      const code = `
        export const Comp = () => (
          <Div
            border={false && '1px solid'}
            borderColor={0 && 'red'}
            outline={null && '2px solid'}
          />
        )
      `
      const result = compileVirtualSync({ 'src/Comp.tsx': code })
      expect(hasWant(result, 'border', '1px solid')).toBe(true)
      expect(hasWant(result, 'borderColor', 'red')).toBe(true)
      expect(hasWant(result, 'outline', '2px solid')).toBe(true)
    })

    it('collects both operands from || and ?? expressions', () => {
      const code = `
        export const Comp = ({ dynamicColor }) => (
          <Div
            color={'red' || 'blue'}
            bg={dynamicColor ?? 'green'}
          />
        )
      `
      const result = compileVirtualSync({ 'src/Comp.tsx': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'color', 'blue')).toBe(true)
      expect(hasWant(result, 'bg', 'green')).toBe(true)
    })
  })

  describe('responsive arrays', () => {
    it('maps array items to default breakpoint conditions', () => {
      const result = compileVirtualSync({
        'src/Comp.tsx': 'export const Comp = () => <Div mt={["1r", "2r", "4r"]} />',
      })
      expect(hasWant(result, 'mt', '1r', ['base'])).toBe(true)
      expect(hasWant(result, 'mt', '2r', ['sm'])).toBe(true)
      expect(hasWant(result, 'mt', '4r', ['md'])).toBe(true)
      expect(getWantsForProp(result, 'mt')).toHaveLength(3)
    })

    it('handles responsive arrays containing ternaries and skips nulls', () => {
      const code = `
        export const Comp = ({ isWide }) => (
          <Div p={['1r', null, isWide ? '4r' : '2r']} />
        )
      `
      const result = compileVirtualSync({ 'src/Comp.tsx': code })
      expect(hasWant(result, 'p', '1r', ['base'])).toBe(true)
      expect(hasWant(result, 'p', '4r', ['md'])).toBe(true)
      expect(hasWant(result, 'p', '2r', ['md'])).toBe(true)
      expect(getWantsForProp(result, 'p')).toHaveLength(3)
    })
  })

  describe('conditions and nesting', () => {
    it('extracts nested pseudo conditions with cumulative when conditions', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        const styles = css({
          _hover: {
            _dark: {
              bg: 'n900',
              color: 'white',
            },
          },
        })
      `
      const result = compileVirtualSync({ 'src/styles.ts': code })
      expect(hasWant(result, 'bg', 'n900', ['_hover', '_dark'])).toBe(true)
      expect(hasWant(result, 'color', 'white', ['_hover', '_dark'])).toBe(true)
    })

    it('extracts pseudo condition props on JSX components', () => {
      const code = `
        export const Button = () => (
          <Button
            bg="n100"
            _hover={{ bg: 'n200' }}
            _focusVisible={{ outline: '2px solid' }}
          />
        )
      `
      const result = compileVirtualSync({ 'src/Button.tsx': code })
      expect(hasWant(result, 'bg', 'n100')).toBe(true)
      expect(hasWant(result, 'bg', 'n200', ['_hover'])).toBe(true)
      expect(hasWant(result, 'outline', '2px solid', ['_focusVisible'])).toBe(true)
    })
  })

  describe('dynamic properties and object spreads', () => {
    it('keeps sibling static properties when dynamic expression is encountered', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        const card = css({
          color: 'red',
          width: props.dynamicWidth,
          height: '100px',
        })
      `
      const result = compileVirtualSync({ 'src/Card.ts': code })
      expect(hasWant(result, 'color', 'red')).toBe(true)
      expect(hasWant(result, 'height', '100px')).toBe(true)
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    })

    it('unpacks inline object spreads', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        const s = css({
          ...{ margin: '10px' },
          padding: '20px',
        })
      `
      const result = compileVirtualSync({ 'src/spread.ts': code })
      expect(hasWant(result, 'margin', '10px')).toBe(true)
      expect(hasWant(result, 'padding', '20px')).toBe(true)
    })
  })

  describe('call sites: css, css.raw, cva, sva, recipe', () => {
    it('extracts from css and css.raw with multiple arguments', () => {
      const code = `
        import { css } from '@reference-ui/styled'
        const c1 = css({ display: 'flex' }, { alignItems: 'center' })
        const c2 = css.raw({ gap: '2r' })
      `
      const result = compileVirtualSync({ 'src/calls.ts': code })
      expect(hasWant(result, 'display', 'flex')).toBe(true)
      expect(hasWant(result, 'alignItems', 'center')).toBe(true)
      expect(hasWant(result, 'gap', '2r')).toBe(true)
    })

    it('extracts variant styles from cva and recipe calls', () => {
      const code = `
        import { cva } from '@reference-ui/styled'
        const badge = cva({
          base: { fontWeight: 'bold' },
          variants: {
            variant: {
              solid: { bg: 'blue', color: 'white' },
              outline: { border: '1px solid' },
            },
          },
          compoundVariants: [
            { variant: 'solid', css: { opacity: '0.9' } },
          ],
        })
      `
      const result = compileVirtualSync({ 'src/badge.ts': code })
      expect(hasWant(result, 'fontWeight', 'bold')).toBe(true)
      expect(hasWant(result, 'bg', 'blue')).toBe(true)
      expect(hasWant(result, 'color', 'white')).toBe(true)
      expect(hasWant(result, 'border', '1px solid')).toBe(true)
      expect(hasWant(result, 'opacity', '0.9')).toBe(true)
    })

    it('extracts slot base styles from sva calls', () => {
      const code = `
        import { sva } from '@reference-ui/styled'
        const alert = sva({
          slots: ['root', 'icon'],
          base: {
            root: { padding: '4r', borderRadius: 'md' },
            icon: { color: 'green' },
          },
        })
      `
      const result = compileVirtualSync({ 'src/alert.ts': code })
      expect(hasWant(result, 'padding', '4r')).toBe(true)
      expect(hasWant(result, 'borderRadius', 'md')).toBe(true)
      expect(hasWant(result, 'color', 'green')).toBe(true)
    })
  })

  describe('runtime classes and stylesheet generation', () => {
    it('populates css.classes runtime map with generated utilities', () => {
      const result = compileVirtualSync({
        'src/Card.tsx': '<Card mt="2r" bg="n300" _hover={{ bg: "n500" }} />',
      })
      expect(result.css.classes).toBeDefined()
      expect(Object.values(result.css.classes ?? {})).toContain('mt_2r')
      expect(Object.values(result.css.classes ?? {})).toContain('bg_n300')
      expect(Object.values(result.css.classes ?? {})).toContain('hover:bg_n500')
      expect(result.stylesheet).toContain('@layer reset')
      expect(result.stylesheet).toContain('@layer utilities')
      expect(result.stylesheet).toContain('.mt_2r')
    })

    it('asynchronously compiles virtual sources', async () => {
      const result = await compileVirtual({
        'src/Async.tsx': '<Div p="3r" />',
      })
      expect(hasWant(result, 'p', '3r')).toBe(true)
      expect(result.stylesheet).toContain('.p_3r')
    })
  })
})
