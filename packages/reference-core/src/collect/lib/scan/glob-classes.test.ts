// Unit tests for negatedClassesAsCaret. They pin which `[!` it rewrites, reading a class as the Rust parse_class does.
// They also check that picomatch then reads each rewritten class as negated.
import picomatch from 'picomatch'
import { describe, expect, it } from 'vitest'
import { negatedClassesAsCaret } from './glob-classes.ts'

describe('negatedClassesAsCaret', () => {
  it('rewrites only a [! that opens a class, as the Rust parse_class reads it', () => {
    expect(negatedClassesAsCaret('src/a[!b].ts')).toBe('src/a[^b].ts')
    expect(negatedClassesAsCaret('src/a\\[!b].ts')).toBe('src/a\\[!b].ts')
    expect(negatedClassesAsCaret('!src/**')).toBe('!src/**')
    expect(negatedClassesAsCaret('a[]!]')).toBe('a[]!]')
    expect(negatedClassesAsCaret('a[!]a]')).toBe('a[^]a]')
    expect(negatedClassesAsCaret('a[!b')).toBe('a[!b')
  })

  it('makes picomatch read [!b] and [!]a] as negated classes', () => {
    const negated = picomatch(negatedClassesAsCaret('a[!b]'), { dot: true })
    expect(['ac', 'ab', 'a!'].map((name) => negated(name))).toEqual([true, false, true])
    const bracket = picomatch(negatedClassesAsCaret('a[!]a]'), { dot: true })
    expect(['ab', 'a]', 'aa'].map((name) => bracket(name))).toEqual([true, false, false])
  })
})
