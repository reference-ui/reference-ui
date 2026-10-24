// Unit tests for the glob model behind the alias-aware project walk. The brace table is copied from atomic's braces.rs tests,
// the position tables pin startPositions and stepPositions, and the differential battery checks the segment model against
// picomatch on every short pattern and path it generates.
import picomatch from 'picomatch'
import { describe, expect, it } from 'vitest'
import { expandBraces } from './braces.ts'
import {
  absoluteSegments,
  compileGlobs,
  startPositions,
  stepPositions,
  unfinishedPositions,
  type CompiledGlobs,
  type GlobListInput,
} from './project-globs.ts'

const ROOT = { rel: '', alias: '/root' }

// A list that must compile: a test that expects a modeled list fails with a clear message when it does not.
function modeled(lists: readonly GlobListInput[]): CompiledGlobs {
  const globs = compileGlobs(lists)
  if (globs === undefined) throw new Error(`expected a modeled list for ${JSON.stringify(lists)}`)
  return globs
}

// Steps a list of names from the start, keeping every position (finished ones included).
function walkNames(globs: CompiledGlobs, prefixes: { rel: string; alias: string }, names: readonly string[]): string[] {
  let positions = startPositions(globs, prefixes)
  for (const name of names) positions = stepPositions(globs, positions, name)
  return positions
}

describe('expandBraces', () => {
  // The table of atomic's braces.rs tests, in the same order.
  it('expands alternations', () => {
    expect(expandBraces('src/*.{ts,tsx}')).toEqual(['src/*.ts', 'src/*.tsx'])
    expect(expandBraces('{a,b}/{c,d}')).toEqual(['a/c', 'a/d', 'b/c', 'b/d'])
  })

  it('expands nested alternations', () => {
    expect(expandBraces('{a,{b,c}}')).toEqual(['a', 'b', 'c'])
  })

  it('keeps commaless braces literal', () => {
    expect(expandBraces('src/{a}.ts')).toEqual(['src/{a}.ts'])
    expect(expandBraces('src/{a')).toEqual(['src/{a'])
  })
})

describe('startPositions and stepPositions', () => {
  it('starts a globstar pattern at its first segment, closed over the globstar', () => {
    expect(startPositions(modeled([{ tag: 'kr', patterns: ['src/**/*.ts'] }]), ROOT)).toEqual(['kr:0:0'])
  })

  // Each row is one pattern, its start, and the positions after each name, in order. stepPositions keeps finished positions.
  it.each([
    {
      pattern: 'src/**/*.ts',
      start: ['kr:0:0'],
      names: ['src', 'a', 'a.ts'],
      steps: [
        ['kr:0:1', 'kr:0:2'],
        ['kr:0:1', 'kr:0:2'],
        ['kr:0:1', 'kr:0:2', 'kr:0:3'],
      ],
    },
    {
      pattern: 'src/a/*.ts',
      start: ['kr:0:0'],
      names: ['src', 'a', 'x.ts'],
      steps: [['kr:0:1'], ['kr:0:2'], ['kr:0:3']],
    },
    {
      pattern: 'src/a/*.ts',
      start: ['kr:0:0'],
      names: ['src', 'b'],
      steps: [['kr:0:1'], []],
    },
    {
      // The self-link of a loop: entering `a` again moves the state to a new position set.
      pattern: '**/a/a/*.ts',
      start: ['kr:0:0', 'kr:0:1'],
      names: ['x', 'a', 'a'],
      steps: [
        ['kr:0:0', 'kr:0:1'],
        ['kr:0:0', 'kr:0:1', 'kr:0:2'],
        ['kr:0:0', 'kr:0:1', 'kr:0:2', 'kr:0:3'],
      ],
    },
  ])('steps $pattern through $names', ({ pattern, start, names, steps }) => {
    const globs = modeled([{ tag: 'kr', patterns: [pattern] }])
    let positions = startPositions(globs, ROOT)
    expect(positions).toEqual(start)
    names.forEach((name, index) => {
      positions = stepPositions(globs, positions, name)
      expect(positions).toEqual(steps[index])
    })
  })

  it('drops finished positions from the unfinished view, which is the state a walk keeps', () => {
    const globs = modeled([{ tag: 'kr', patterns: ['src/**/*.ts'] }])
    const finished = walkNames(globs, ROOT, ['src', 'a', 'a.ts'])
    expect(finished).toContain('kr:0:3')
    expect(unfinishedPositions(globs, finished)).toEqual(['kr:0:1', 'kr:0:2'])
  })

})

describe('startPositions for each form and the unfinished view', () => {
  it('keeps each brace alternative as its own position set', () => {
    const globs = modeled([{ tag: 'kr', patterns: ['src/{a,b}/**/x.ts'] }])
    expect(startPositions(globs, ROOT)).toEqual(['kr:0:0', 'kr:1:0'])
    expect(stepPositions(globs, ['kr:0:0', 'kr:1:0'], 'src')).toEqual(['kr:0:1', 'kr:1:1'])
    expect(stepPositions(globs, ['kr:0:1', 'kr:1:1'], 'b')).toEqual(['kr:1:2', 'kr:1:3'])
  })

  it('starts an absolute list from the alias prefix and a relative list from the rel prefix', () => {
    const absolute = modeled([{ tag: 'ka', patterns: ['/abs/x/**/*.ts'] }])
    expect(startPositions(absolute, { rel: '../shared', alias: '/abs/x' })).toEqual(['ka:0:3', 'ka:0:4'])
    const ignore = modeled([{ tag: 'ir', patterns: ['src/a/**'] }])
    expect(startPositions(ignore, { rel: 'src', alias: '/root' })).toEqual(['ir:0:1'])
  })

  it('reads a win32 drive path on either separator as drive-first segments, and a posix path from its root segment', () => {
    expect(absoluteSegments('C:\\repo\\src')).toEqual(['C:', 'repo', 'src'])
    expect(absoluteSegments('C:/repo/src')).toEqual(['C:', 'repo', 'src'])
    expect(absoluteSegments('d:\\repo/mixed\\src\\')).toEqual(['d:', 'repo', 'mixed', 'src'])
    expect(absoluteSegments('/abs/x')).toEqual(['', 'abs', 'x'])
    expect(absoluteSegments('/abs/we\\ird/x')).toEqual(['', 'abs', 'we\\ird', 'x'])
  })

  it('starts an absolute list from a win32 alias exactly as from the same path written with slashes', () => {
    const absolute = modeled([{ tag: 'ka', patterns: ['C:/repo/src/**/*.ts'] }])
    const fromDrive = startPositions(absolute, { rel: '../src', alias: 'C:\\repo\\src' })
    expect(fromDrive).toEqual(startPositions(absolute, { rel: '../src', alias: 'C:/repo/src' }))
    expect(fromDrive).toEqual(['ka:0:3', 'ka:0:4'])
  })

  it('starts a local list at the base and sorts the tagged lists together', () => {
    const globs = modeled([
      { tag: 'kr', patterns: ['../shared/**/*.ts'] },
      { tag: 'il', patterns: ['**/node_modules/**'] },
    ])
    expect(startPositions(globs, { rel: '../shared', alias: '/abs/x' })).toEqual([
      'il:0:0',
      'il:0:1',
      'kr:0:2',
      'kr:0:3',
    ])
  })
})

describe('compileGlobs unmodeled detection', () => {
  it.each([
    'src/**/*.{ts,tsx}',
    'src/{a,b}/**/x.ts',
    'src/{!a,b}/x.ts',
    'src/!a/*.ts',
    'src/[ab]/x.ts',
    '**/node_modules/**',
    '../shared/**/*.ts',
    '/abs/x/**/*.ts',
  ])('models %s', (pattern) => {
    expect(compileGlobs([{ tag: 'kr', patterns: [pattern] }])).toBeDefined()
  })

  it.each([
    'src/(a|b)/*.ts',
    'src/a|b/*.ts',
    'src\\a/*.ts',
    'src/[:alpha:]/*.ts',
    'src/**x/*.ts',
    'src/***/*.ts',
    // A bracket or brace that spans a slash: picomatch reads one class or literal across two segments.
    'src/[a/b]/x.ts',
    'src/{a/*}/x.ts',
    'src/a[/x]/y.ts',
    'src/a{b/*.ts',
  ])('leaves %s unmodeled', (pattern) => {
    expect(compileGlobs([{ tag: 'kr', patterns: [pattern] }])).toBeUndefined()
  })

  it('leaves a list unmodeled when one alternative is, and a negated pattern is never modeled', () => {
    expect(compileGlobs([{ tag: 'kr', patterns: ['src/**/*.ts', 'src/(a|b)/*.ts'] }])).toBeUndefined()
    expect(compileGlobs([{ tag: 'ir', patterns: ['!src/a/**'] }])).toBeUndefined()
  })
})

// Every short pattern over these segments, and every short path over these names, checked against picomatch.
const SEGMENTS = ['a', '*', '**', '?', '[ab]', '!a', 'a*']
const NAMES = ['a', 'b', 'ab', '!a', '.a']

function everyPattern(maxDepth: number): string[] {
  const patterns: string[] = []
  let level = SEGMENTS.map((segment) => [segment])
  for (let depth = 1; depth <= maxDepth; depth++) {
    patterns.push(...level.map((segments) => segments.join('/')))
    level = level.flatMap((segments) => SEGMENTS.map((segment) => [...segments, segment]))
  }
  return patterns.filter((pattern) => !pattern.startsWith('!'))
}

function everyPath(maxDepth: number): string[][] {
  const paths: string[][] = []
  let level: string[][] = NAMES.map((name) => [name])
  for (let depth = 1; depth <= maxDepth; depth++) {
    paths.push(...level)
    level = level.flatMap((names) => NAMES.map((name) => [...names, name]))
  }
  return paths
}

// picomatch does not match a run of trailing globstars that takes zero segments right after a star segment (`*/**` does not
// match `a`, nor `a/*/**` match `a/x`), while the model's closure does. The walk decides keep and ignore with picomatch on the
// full path, so this only moves the verdict of a path that ends there; the shape is pinned so any other disagreement fails.
function starBeforeTrailingGlobstar(pattern: string): boolean {
  const segments = pattern.split('/')
  let start = segments.length
  while (start > 0 && segments[start - 1] === '**') start -= 1
  if (start === 0 || start === segments.length) return false
  const before = segments[start - 1] ?? ''
  return before !== '**' && before.includes('*')
}

// The model accepts a path exactly when picomatch does, except on the shape picomatch does not match (see starBeforeTrailingGlobstar).
function checkAcceptance(pattern: string, paths: readonly string[][]): void {
  const globs = modeled([{ tag: 'kr', patterns: [pattern] }])
  const finished = `kr:0:${pattern.split('/').length}`
  const match = picomatch(pattern, { dot: true })
  for (const path of paths) {
    const accepted = walkNames(globs, ROOT, path).includes(finished)
    const verdict = match(path.join('/'))
    const label = `${pattern} against ${path.join('/')}`
    if (verdict) expect(accepted, label).toBe(true)
    if (accepted && !verdict) expect(starBeforeTrailingGlobstar(pattern), label).toBe(true)
  }
}

// The walk's invariant: a state is the unfinished positions after a path, and it alone decides every verdict on the next name.
function checkStateDecides(pattern: string, paths: readonly string[][]): void {
  const globs = modeled([{ tag: 'kr', patterns: [pattern] }])
  const match = picomatch(pattern, { dot: true })
  const verdicts = new Map<string, boolean>()
  for (const path of paths) {
    const state = unfinishedPositions(globs, walkNames(globs, ROOT, path)).join(',')
    for (const name of NAMES) {
      const verdict = match([...path, name].join('/'))
      const key = `${state}|${name}`
      const previous = verdicts.get(key)
      if (previous === undefined) verdicts.set(key, verdict)
      else expect(verdict, `${pattern}: ${path.join('/')} then ${name}, state ${state}`).toBe(previous)
    }
  }
}

describe('the segment model agrees with picomatch', () => {
  const patterns = everyPattern(3)

  it('accepts every path picomatch accepts, and differs only on the star-before-trailing-globstar shape', () => {
    for (const pattern of patterns) checkAcceptance(pattern, everyPath(3))
  })

  // Paths up to depth two already share states; the deeper set ran past vitest's five-second budget under a full-package run.
  it('gives every path with the same unfinished state the same verdict on each next name', () => {
    for (const pattern of patterns) checkStateDecides(pattern, everyPath(2))
  })
})
