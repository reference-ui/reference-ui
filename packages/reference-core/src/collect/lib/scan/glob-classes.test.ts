// Unit tests for negatedClassesAsCaret. They pin which `[!` it rewrites, reading a class as the Rust parse_class does.
// They also check that picomatch then reads each rewritten glob as Rust does: negated classes, unclosed `[` and in-class backslashes.
import picomatch from 'picomatch'
import { describe, expect, it } from 'vitest'
import { classEnd, hasPosixClass, negatedClassesAsCaret, splitClasses } from './glob-classes.ts'

describe('negatedClassesAsCaret', () => {
  it('rewrites only a [! that opens a class, as the Rust parse_class reads it', () => {
    expect(negatedClassesAsCaret('src/a[!b].ts')).toBe('src/a[^b].ts')
    expect(negatedClassesAsCaret('src/a\\[!b].ts')).toBe('src/a\\[!b].ts')
    expect(negatedClassesAsCaret('!src/**')).toBe('!src/**')
    expect(negatedClassesAsCaret('a[]!]')).toBe('a[]!]')
    expect(negatedClassesAsCaret('a[!]a]')).toBe('a[^]a]')
    expect(negatedClassesAsCaret('a[!b')).toBe('a\\[!b')
    expect(negatedClassesAsCaret('src/[!]')).toBe('src/\\[!]')
    expect(negatedClassesAsCaret('a[\\]]c')).toBe('a[\\\\]]c')
    expect(negatedClassesAsCaret('a[!\\]]c')).toBe('a[^\\\\]]c')
  })

  it('makes picomatch read an unclosed [ as a literal, as Rust does', () => {
    const unclosed = picomatch(negatedClassesAsCaret('src/[!]'), { dot: true })
    expect(['src/[!]', 'src/!', 'src/]', 'src/a'].map((name) => unclosed(name))).toEqual([true, false, false, false])
    const open = picomatch(negatedClassesAsCaret('a[!b'), { dot: true })
    expect(['a[!b', 'ac', 'a!b'].map((name) => open(name))).toEqual([true, false, false])
  })

  it('makes picomatch read a backslash inside a class as a member, as Rust does', () => {
    const member = picomatch(negatedClassesAsCaret('a[\\]]c'), { dot: true })
    expect(['a\\]c', 'a]c'].map((name) => member(name))).toEqual([true, false])
    const negated = picomatch(negatedClassesAsCaret('a[!\\]]c'), { dot: true })
    expect(['a\\]c', 'a]c', 'ax]c'].map((name) => negated(name))).toEqual([false, false, true])
  })

  it('makes picomatch read [!b] and [!]a] as negated classes', () => {
    const negated = picomatch(negatedClassesAsCaret('a[!b]'), { dot: true })
    expect(['ac', 'ab', 'a!'].map((name) => negated(name))).toEqual([true, false, true])
    const bracket = picomatch(negatedClassesAsCaret('a[!]a]'), { dot: true })
    expect(['ab', 'a]', 'aa'].map((name) => bracket(name))).toEqual([true, false, false])
  })
})

describe('classEnd', () => {
  it('finds the closing bracket as the Rust parse_class does, or nothing', () => {
    const end = (glob: string, open = 0) => classEnd(Array.from(glob), open)
    expect(end('[ab]')).toBe(3)
    expect(end('[!a]')).toBe(3)
    expect(end('[]a]')).toBe(3)
    expect(end('[!]a]')).toBe(4)
    expect(end('[ab')).toBeUndefined()
    expect(end('x[(]', 1)).toBe(3)
  })
})

describe('splitClasses and hasPosixClass', () => {
  it('splits the text outside every class from the inside of each class', () => {
    expect(splitClasses('src/[(]x[)]/a.ts')).toEqual({ outside: 'src/x/a.ts', inside: ['(', ')'] })
    expect(splitClasses('a[!b]c')).toEqual({ outside: 'ac', inside: ['!b'] })
    expect(splitClasses('a[b')).toEqual({ outside: 'a[b', inside: [] })
    expect(splitClasses('a\\[b]')).toEqual({ outside: 'a\\[b]', inside: [] })
  })

  it('reads [[:alpha:]] as a class that holds a POSIX name, and [:alpha:] as a plain class', () => {
    expect(splitClasses('[[:alpha:]]').inside.some(hasPosixClass)).toBe(true)
    expect(splitClasses('[:alpha:]').inside.some(hasPosixClass)).toBe(false)
    expect(hasPosixClass('a[:digit:')).toBe(true)
    expect(hasPosixClass('a[:nope:')).toBe(false)
  })
})
