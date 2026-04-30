import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const refUiDir = join(process.cwd(), '.reference-ui')
const suspiciousStylesheetFragments = ['[object Object]', 'undefined', 'NaN', '\u0000', '\uFFFD'] as const

async function waitForGeneratedFile(relativePath: string, maxMs = 45_000): Promise<string> {
  const absolutePath = join(refUiDir, relativePath)
  const startedAt = Date.now()

  while (Date.now() - startedAt < maxMs) {
    if (existsSync(absolutePath)) {
      return readFileSync(absolutePath, 'utf-8')
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Expected generated file ${relativePath} within ${maxMs}ms`)
}

const generatedOutput = {
  reactStylesheet: '',
}

function getAtRule(name: 'container' | 'media', params: string): string {
  const marker = `@${name} ${params} {`
  const startIndex = generatedOutput.reactStylesheet.indexOf(marker)

  expect(startIndex).toBeGreaterThanOrEqual(0)

  let depth = 0

  for (let index = startIndex; index < generatedOutput.reactStylesheet.length; index += 1) {
    const character = generatedOutput.reactStylesheet[index]

    if (character === '{') {
      depth += 1
      continue
    }

    if (character === '}') {
      depth -= 1

      if (depth === 0) {
        return generatedOutput.reactStylesheet.slice(startIndex, index + 1)
      }
    }
  }

  throw new Error(`Expected to close @${name} ${params}`)
}

beforeAll(async () => {
  const reactStylesheet = await waitForGeneratedFile(join('react', 'styles.css'))

  generatedOutput.reactStylesheet = reactStylesheet
})

describe('responsive generated output', () => {
  it('keeps generated react/styles.css non-empty', () => {
    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
  })

  it('keeps suspicious placeholder fragments out of generated react/styles.css', () => {
    const foundFragments = suspiciousStylesheetFragments.filter((fragment) =>
      generatedOutput.reactStylesheet.includes(fragment),
    )

    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
    expect(foundFragments).toEqual([])
  })

  it('emits the anonymous primitive source rule at 333px without malformed container names', () => {
    const anonymousRule = getAtRule('container', '(min-width: 333px)')

    expect(anonymousRule).toContain('padding: 1.25rem')
    expect(generatedOutput.reactStylesheet).not.toContain('@container true')
  })

  it('emits the named primitive source rule at shell 777px', () => {
    const shellRule = getAtRule('container', 'shell (min-width: 777px)')

    expect(shellRule).toContain('font-size: 1.125rem')
  })

  it('emits both nested anonymous container breakpoints from the same source fixture', () => {
    const firstRule = getAtRule('container', '(min-width: 300px)')
    const secondRule = getAtRule('container', '(min-width: 600px)')

    expect(firstRule).toContain('padding: 0.5rem')
    expect(secondRule).toContain('padding: 1.5rem')
  })

  it('emits the named nested sidebar rule across ancestors', () => {
    const sidebarRule = getAtRule('container', 'sidebar (min-width: 400px)')

    expect(sidebarRule).toContain('padding: 1rem')
    expect(sidebarRule).toContain('font-size: 1.125rem')
  })

  it('emits the shared 360px container block for primitive, css(), and recipe() responsive branches', () => {
    const sharedRule = getAtRule('container', '(min-width: 360px)')

    expect(sharedRule).toContain('padding: 10px')
    expect(sharedRule).toContain('background-color: #dbeafe')
    expect(sharedRule).toContain('padding-top: 14px')
    expect(sharedRule).toContain('background-color: #1d4ed8')
    expect(sharedRule).toContain('padding-top: 18px')
    expect(sharedRule).toContain('background-color: #15803d')
  })

  it('keeps mixed container and viewport branches emitted as separate responsive rules', () => {
    const mixedContainerRule = getAtRule('container', '(min-width: 260px)')
    const viewportRule = getAtRule('media', '(min-width: 800px)')

    expect(mixedContainerRule).toContain('padding-top: 18px')
    expect(mixedContainerRule).toContain('background-color: #fef3c7')
    expect(viewportRule).toContain('border-top-width: 6px')
    expect(viewportRule).toContain('border-top-color: #ea580c')
  })
})