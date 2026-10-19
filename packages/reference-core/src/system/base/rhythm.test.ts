// Unit tests for rhythm lowering. The first blocks port every assertion of the Rust `#[cfg(test)] mod tests` in
// atomic's resolve/rhythm, with the same expected strings. The later blocks pin what only the TS port decides: the
// decimal grammar, the delimiter set, the protected functions, and getRhythm's number formatting. They take plain
// strings and assert the CSS that lowerRhythm, lowerRhythmWord and getRhythm print.

import { describe, expect, it } from 'vitest'
import { getRhythm, lowerRhythm, lowerRhythmWord } from './rhythm.ts'

describe('rhythm: base units', () => {
  it('lowers the bare unit forms', () => {
    expect(lowerRhythm('r')).toBe('var(--spacing-root)')
    expect(lowerRhythm('+r')).toBe('var(--spacing-root)')
    expect(lowerRhythm('1r')).toBe('var(--spacing-root)')
    expect(lowerRhythm('-r')).toBe('calc(-1 * var(--spacing-root))')
  })
})

describe('rhythm: multipliers and decimals', () => {
  it('lowers integer, decimal and negative multipliers', () => {
    expect(lowerRhythm('2r')).toBe('calc(2 * var(--spacing-root))')
    expect(lowerRhythm('0.5r')).toBe('calc(0.5 * var(--spacing-root))')
    expect(lowerRhythm('1.5r')).toBe('calc(1.5 * var(--spacing-root))')
    expect(lowerRhythm('-2r')).toBe('calc(-2 * var(--spacing-root))')
  })
})

describe('rhythm: fractions', () => {
  it('lowers unit and multi-part fractions, signed or not', () => {
    expect(lowerRhythm('1/3r')).toBe('calc(var(--spacing-root) / 3)')
    expect(lowerRhythm('2/3r')).toBe('calc(2 * var(--spacing-root) / 3)')
    expect(lowerRhythm('-1/3r')).toBe('calc(-1 * var(--spacing-root) / 3)')
    expect(lowerRhythm('-2/3r')).toBe('calc(-2 * var(--spacing-root) / 3)')
  })
})

describe('rhythm: non-finite stems refuse silently', () => {
  it('refuses named spellings, case variants, overflow and an infinite fraction, and passes them through', () => {
    const stems = ['infr', 'nanr', 'infinityr', 'Infinityr', '-infr', '-nanr', 'NANr', '1e309r', '1/infr', 'inf/3r']
    for (const stem of stems) {
      expect(lowerRhythmWord(stem), stem).toBeUndefined()
      expect(lowerRhythm(stem), stem).toBe(stem)
    }
    const giant = `${'9'.repeat(309)}r`
    expect(lowerRhythmWord(giant)).toBeUndefined()
    expect(lowerRhythm(giant)).toBe(giant)
  })
})

describe('rhythm: finite neighbors still mint', () => {
  it('mints 0.5r, 1e-3r and 1e308r, the last at full Rust Display width', () => {
    expect(lowerRhythm('0.5r')).toBe('calc(0.5 * var(--spacing-root))')
    expect(lowerRhythm('1e-3r')).toBe('calc(0.001 * var(--spacing-root))')
    expect(lowerRhythmWord('1e308r')).toBeDefined()
    expect(lowerRhythm('1e308r')).toBe(`calc(1${'0'.repeat(308)} * var(--spacing-root))`)
  })
})

describe('rhythm: multi-value pass through', () => {
  it('lowers each word and keeps the separators and the plain values', () => {
    expect(lowerRhythm('1r 2r')).toBe('var(--spacing-root) calc(2 * var(--spacing-root))')
    expect(lowerRhythm('1px solid 1/3r')).toBe('1px solid calc(var(--spacing-root) / 3)')
    expect(lowerRhythm('10px auto')).toBe('10px auto')
  })
})

describe('rhythm: math function bodies resolve', () => {
  it('lowers rhythm inside calc and min, at any depth', () => {
    expect(lowerRhythm('calc(1px + 1r)')).toBe('calc(1px + var(--spacing-root))')
    expect(lowerRhythm('min(1r, 10px)')).toBe('min(var(--spacing-root), 10px)')
    expect(lowerRhythm('calc(min(1r, 10px) + 2r)')).toBe(
      'calc(min(var(--spacing-root), 10px) + calc(2 * var(--spacing-root)))'
    )
  })
})

describe('rhythm: var, url and env bodies stay literal', () => {
  it('keeps every word inside var(), url() and env() as written', () => {
    expect(lowerRhythm('var(--spacing-y, 1r)')).toBe('var(--spacing-y, 1r)')
    expect(lowerRhythm('var(--x)')).toBe('var(--x)')
    expect(lowerRhythm('url(1r.png)')).toBe('url(1r.png)')
    expect(lowerRhythm('env(safe-area-inset-top)')).toBe('env(safe-area-inset-top)')
  })
})

describe('rhythm: the TS edges of the decimal and fraction grammar', () => {
  it('lowers a leading dot, a trailing dot, a signed stem, zero and negative zero', () => {
    expect(lowerRhythm('.5r')).toBe('calc(0.5 * var(--spacing-root))')
    expect(lowerRhythm('5.r')).toBe('calc(5 * var(--spacing-root))')
    expect(lowerRhythm('+5r')).toBe('calc(5 * var(--spacing-root))')
    expect(lowerRhythm('-.5r')).toBe('calc(-0.5 * var(--spacing-root))')
    expect(lowerRhythm('5E5r')).toBe('calc(500000 * var(--spacing-root))')
    expect(lowerRhythm('0r')).toBe('calc(0 * var(--spacing-root))')
    expect(lowerRhythm('-0r')).toBe('calc(-0 * var(--spacing-root))')
  })

  it('passes a malformed or zero-denominator fraction through', () => {
    for (const word of ['1/0r', '1/-0r', '1//3r', '/3r', '1/r', '1/3/r']) {
      expect(lowerRhythmWord(word), word).toBeUndefined()
      expect(lowerRhythm(word), word).toBe(word)
    }
  })

  it('refuses a malformed exponent and a double sign', () => {
    for (const word of ['5er', '5e+r', '+-5r', '--5r', '1..5r', '.r', '.']) {
      expect(lowerRhythmWord(word), word).toBeUndefined()
      expect(lowerRhythm(word), word).toBe(word)
    }
  })

  it('lowers a rhythm word inside calc() and keeps the operators', () => {
    expect(lowerRhythm('calc(100% - 2r)')).toBe('calc(100% - calc(2 * var(--spacing-root)))')
  })

  it('leaves words that only end in r, or carry a unit, as written', () => {
    for (const value of ['for', '2rem', 'color', '1px solid red', '"2r"']) {
      expect(lowerRhythm(value), value).toBe(value)
    }
    expect(lowerRhythm('var (1r)')).toBe('var (1r)')
  })

  it('splits on the White_Space set and on ( ) , *, but not on U+FEFF', () => {
    expect(lowerRhythm('2r,3r')).toBe('calc(2 * var(--spacing-root)),calc(3 * var(--spacing-root))')
    expect(lowerRhythm('2r*3r')).toBe('calc(2 * var(--spacing-root))*calc(3 * var(--spacing-root))')
    expect(lowerRhythm('1px\u00a02r')).toBe('1px\u00a0calc(2 * var(--spacing-root))')
    expect(lowerRhythm('\ufeff2r')).toBe('\ufeff2r')
  })

  it('treats var, url and env case-insensitively, at any depth', () => {
    expect(lowerRhythm('VAR(--x, 1r)')).toBe('VAR(--x, 1r)')
    expect(lowerRhythm('var(--x, calc(1r))')).toBe('var(--x, calc(1r))')
    expect(lowerRhythm('calc(var(--x) + 2r)')).toBe('calc(var(--x) + calc(2 * var(--spacing-root)))')
  })

  it('lets a bare paren take the last word as its name, as the compiler does', () => {
    expect(lowerRhythm('var(--x) (1r)')).toBe('var(--x) (var(--spacing-root))')
  })
})

describe('getRhythm', () => {
  it('prints the same CSS as the rhythm words', () => {
    expect(getRhythm(1)).toBe('var(--spacing-root)')
    expect(getRhythm(-1)).toBe('calc(-1 * var(--spacing-root))')
    expect(getRhythm(2)).toBe('calc(2 * var(--spacing-root))')
    expect(getRhythm(1, 3)).toBe('calc(var(--spacing-root) / 3)')
    expect(getRhythm(-1, 3)).toBe('calc(-1 * var(--spacing-root) / 3)')
    expect(getRhythm(2, 3)).toBe('calc(2 * var(--spacing-root) / 3)')
  })

  it('prints a decimal in plain digits, as Rust Display does', () => {
    expect(getRhythm(1e-7)).toBe('calc(0.0000001 * var(--spacing-root))')
    expect(getRhythm(-1e-7)).toBe('calc(-0.0000001 * var(--spacing-root))')
    expect(getRhythm(1.5e-7)).toBe('calc(0.00000015 * var(--spacing-root))')
    expect(getRhythm(1e21)).toBe(`calc(1${'0'.repeat(21)} * var(--spacing-root))`)
    expect(getRhythm(-0)).toBe('calc(-0 * var(--spacing-root))')
  })
})
