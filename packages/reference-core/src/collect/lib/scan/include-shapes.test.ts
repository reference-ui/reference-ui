// Unit tests for the include shape check and the validation that runs it. They pin the refused shapes and the form each message tells the author to write,
// the rewrites that make a paren group mean what the Rust grammar means, and a property: every pattern config validation
// accepts is one compileGlobs models, so no validated include takes the walk's per-path loop cut.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../../config/validate.ts'
import { includeShapeProblem, normalizeIncludePattern } from './include-shapes.ts'
import { compileGlobs } from './project-globs.ts'

// The pattern after the rewrite, with the problem validation would report for it (if any).
function problemOf(pattern: string): string | undefined {
  return includeShapeProblem(normalizeIncludePattern(pattern), pattern)
}

describe('normalizeIncludePattern', () => {
  it('reads a paren group with a pipe as a brace alternation', () => {
    expect(normalizeIncludePattern('src/(a|b)/*.ts')).toBe('src/{a,b}/*.ts')
    expect(normalizeIncludePattern('(a|b|c)')).toBe('{a,b,c}')
    expect(normalizeIncludePattern('src/(a|[b|c])/x.ts')).toBe('src/{a,[b|c]}/x.ts')
  })

  it('reads a paren group with no pipe as the literal Rust reads, so a route-group folder keeps working', () => {
    expect(normalizeIncludePattern('app/(marketing)/**')).toBe('app/[(]marketing[)]/**')
    expect(normalizeIncludePattern('(x)')).toBe('[(]x[)]')
  })

  it('keeps one leading negation and rewrites the body', () => {
    expect(normalizeIncludePattern('!(a|b)/**')).toBe('!{a,b}/**')
    expect(normalizeIncludePattern('!!(a|b)')).toBe('!!(a|b)')
  })

  it('leaves parens inside a class, extglobs, nested groups and groups holding braces or commas as they are', () => {
    for (const pattern of ['src/[(]/x.ts', 'src/[()]/x.ts', '@(a|b)', 'x!(a|b)', '+(a|b)', '*(a|b)', '?(a|b)', '(a,b|c)', '(a|{b,c})', '(a']) {
      expect(normalizeIncludePattern(pattern), pattern).toBe(pattern)
    }
    expect(normalizeIncludePattern('((a|b))')).toBe('({a,b})')
  })
})

describe('includeShapeProblem', () => {
  it.each([
    ['!!x', 'starts with two negation marks; write one leading ! to negate the pattern'],
    ['src\\a/*.ts', 'uses a backslash; write a character class'],
    ['@(a|b)', 'uses parentheses or a pipe that sync cannot read; write {a,b} for alternatives'],
    ['a|b', 'uses parentheses or a pipe that sync cannot read; write {a,b} for alternatives'],
    ['src/a|b/*.ts', 'uses parentheses or a pipe that sync cannot read'],
    ['src/((a|b))/*.ts', 'uses parentheses or a pipe that sync cannot read'],
    ['src/(a/*.ts', 'uses parentheses or a pipe that sync cannot read'],
    ['src/[[:alpha:]]/*.ts', 'uses a POSIX class; write a plain class such as [a-zA-Z]'],
    ['src/[a[:digit:]]/*.ts', 'uses a POSIX class'],
    ['src/***/*.ts', 'has a run of three or more stars; write ** for any folders'],
    ['src/**x/*.ts', 'has ** inside a folder name; write **/*x or x*/**'],
    ['src/x**/*.ts', 'has ** inside a folder name'],
    ['src/[a/b]/x.ts', 'has a bracket or brace that a / splits; write every bracket and brace closed inside one folder name'],
    ['src/{a/*}/x.ts', 'has a bracket or brace that a / splits'],
    ['src/a[/x]/y.ts', 'has a bracket or brace that a / splits'],
    ['src/a{b/*.ts', 'has a bracket or brace that a / splits'],
  ])('refuses %s', (pattern, tail) => {
    expect(problemOf(pattern)).toContain(`include pattern '${pattern}' ${tail}`)
  })

  it('names the pattern as written, not as normalized', () => {
    expect(problemOf('!src/(a|b)/***/x.ts')).toMatch(/^include pattern '!src\/\(a\|b\)\/\*\*\*\/x\.ts' has a run/)
  })

  it('accepts what the walk models, and what a rewrite turns into it', () => {
    for (const pattern of [
      'src/**/*.{ts,tsx}',
      '!src/**/*.test.ts',
      'src/(a|b)/*.ts',
      'app/(marketing)/**',
      'src/[:alpha:]/*.ts',
      'src/[(]/x.ts',
      'src/[!a]/x.ts',
      '../shared/**',
      '/abs/x/**/*.ts',
      'src/!a/*.ts',
    ]) {
      expect(problemOf(pattern), pattern).toBeUndefined()
    }
  })
})

describe('validateConfig include shapes', () => {
  const withInclude = (include: string[]) => ({ name: 'my-system', include })

  it('stores the normalized patterns: (a|b) as {a,b} and a parenthesised name as the literal class', () => {
    const config = validateConfig(withInclude(['src/(a|b)/*.ts', 'app/(marketing)/**', '!(x|y)/**', 'src/**/*.{ts,tsx}']))

    expect(config.include).toEqual(['src/{a,b}/*.ts', 'app/[(]marketing[)]/**', '!{x,y}/**', 'src/**/*.{ts,tsx}'])
  })

  it.each([
    ['@(a|b)', 'uses parentheses or a pipe that sync cannot read; write {a,b} for alternatives'],
    ['src/a|b/*.ts', 'uses parentheses or a pipe that sync cannot read; write {a,b} for alternatives'],
    ['!!src/**', 'starts with two negation marks; write one leading ! to negate the pattern'],
    ['src\\a/*.ts', 'uses a backslash; write a character class for a literal character, such as [*] for a star'],
    ['src/[[:alpha:]]/*.ts', 'uses a POSIX class; write a plain class such as [a-zA-Z] or [0-9]'],
    ['src/***/*.ts', 'has a run of three or more stars; write ** for any folders or * inside a name'],
    ['src/**x/*.ts', 'has ** inside a folder name; write **/*x or x*/** with ** as a whole folder name'],
    ['src/[a/b]/x.ts', 'has a bracket or brace that a / splits; write every bracket and brace closed inside one folder name'],
  ])('refuses %s, naming the pattern and the form to write', (pattern, tail) => {
    expect(() => validateConfig(withInclude(['src/**/*.ts', pattern]))).toThrowError(
      `Config field 'include' is invalid.\ninclude pattern '${pattern}' ${tail}`
    )
  })

  it('names a rewritten pattern as written when a later shape check refuses it', () => {
    expect(() => validateConfig(withInclude(['src/(a|b)/***/x.ts']))).toThrowError(
      "include pattern 'src/(a|b)/***/x.ts' has a run of three or more stars"
    )
  })

  it('reads the brace limits on the rewritten pattern', () => {
    const wide = `src/${'(a|b)'.repeat(11)}`

    expect(() => validateConfig(withInclude([wide]))).toThrowError(`include pattern '${wide}' expands to more than 1,024 globs`)
  })

  it('returns the evaluated object itself when no include needs a rewrite, and a copy when one does', () => {
    const plain = withInclude(['src/**/*.ts'])
    const grouped = withInclude(['src/(a|b)/*.ts'])

    expect(validateConfig(plain)).toBe(plain)
    expect(validateConfig(grouped)).not.toBe(grouped)
    expect(grouped.include).toEqual(['src/(a|b)/*.ts'])
  })

  it('passes every include the repo itself uses', () => {
    expect(() =>
      validateConfig(withInclude(['src/**/*.{ts,tsx}', '../shared/**', '!src/**/*.test.ts', 'src/[!_]*/x.ts', 'src/!a/*.ts']))
    ).not.toThrow()
  })
})

// A small deterministic generator, so the property test is the same on every run.
function lcg(seed: number): () => number {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const TOKENS = [
  'a', 'b', 'ab', '*', '**', '***', '?', '/', '/', '/', '{', '}', ',', '[', ']', '[ab]', '[!a]', '(', ')', '|', '!', '@', '+',
  '\\', '[:a]', '[:alpha:]', '[(]', '[)]', '[[:alpha:]]', '.', '(a|b)', '(x)', '{a,b}', '**/', '/**',
]

function generated(count: number): string[] {
  const next = lcg(20261024)
  const patterns: string[] = []
  for (let i = 0; i < count; i++) {
    const length = 1 + Math.floor(next() * 8)
    let pattern = ''
    for (let t = 0; t < length; t++) pattern += TOKENS[Math.floor(next() * TOKENS.length)]
    patterns.push(pattern)
  }
  return patterns
}

// The pattern validation stores, or undefined when validation refuses it.
function stored(pattern: string): string | undefined {
  try {
    return validateConfig({ name: 'shapes', include: [pattern] }).include[0]
  } catch {
    return undefined
  }
}

describe('every include that validates is modeled', () => {
  it('compiles the stored form of each generated pattern validation accepts', () => {
    let accepted = 0
    for (const pattern of generated(6000)) {
      const kept = stored(pattern)
      if (kept === undefined) continue
      accepted += 1
      const body = kept.startsWith('!') ? kept.slice(1) : kept
      expect(compileGlobs([{ tag: 'kr', patterns: [body] }]), `${pattern} stored as ${kept}`).toBeDefined()
    }
    expect(accepted).toBeGreaterThan(300)
  })
})
