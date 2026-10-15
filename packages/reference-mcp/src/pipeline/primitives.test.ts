import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { analyzeDetailed } from '@reference-ui/rust/atlas'
import { afterEach, describe, expect, it } from 'vitest'

import { getAtlasMcpConfig } from './config'
import {
  createObservedReferenceUiPrimitives,
  findReferenceUiPrimitive,
} from './primitives'
import type { McpComponent } from './types'

const roots: string[] = []

/**
 * Writes a throwaway project, runs the real Atlas analysis with the MCP config,
 * and maps the observed elements onto the primitive catalog.
 */
async function observeProject(files: Record<string, string>): Promise<McpComponent[]> {
  const root = await mkdtemp(join(tmpdir(), 'reference-ui-mcp-primitives-'))
  roots.push(root)

  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'primitive-fixture', private: true }))
  for (const [path, source] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), source)
  }

  const atlas = await analyzeDetailed(
    root,
    getAtlasMcpConfig({ name: 'primitive-fixture', include: ['src/**/*.{ts,tsx}'] })
  )
  return createObservedReferenceUiPrimitives(atlas.observed ?? [])
}

function observeApp(source: string): Promise<McpComponent[]> {
  return observeProject({ 'src/App.tsx': source })
}

function observedPropNames(component: McpComponent | undefined): string[] {
  return (component?.props ?? [])
    .filter(prop => prop.count > 0)
    .map(prop => prop.name)
    .sort()
}

describe('createObservedReferenceUiPrimitives (Atlas observe)', () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
  })

  it('detects directly imported Code primitive usage', async () => {
    const components = await observeApp(`
      import { Code, Div } from '@reference-ui/react'

      export function App() {
        return (
          <Div>
            <Code>src/App.tsx</Code>
            <Code>ui.config.ts</Code>
          </Div>
        )
      }
    `)

    expect(components.find(component => component.name === 'Code')).toMatchObject({
      kind: 'primitive',
      source: '@reference-ui/react',
      count: 2,
      usage: 'very common',
      examples: ['<Code>'],
      props: expect.arrayContaining([
        expect.objectContaining({ name: 'children', count: 2, origin: 'observed' }),
      ]),
    })
    expect(components.find(component => component.name === 'Div')).toMatchObject({
      count: 1,
      usage: 'common',
    })
  })

  it('falls back to JSX primitive names when the file references Reference UI', async () => {
    const components = await observeApp(`
      import { Div } from '@reference-ui/react'

      export function App() {
        return (
          <Div>
            <Code>src/App.tsx</Code>
          </Div>
        )
      }
    `)

    expect(components.find(component => component.name === 'Code')).toMatchObject({
      count: 1,
      examples: ['<Code>'],
      props: expect.arrayContaining([
        expect.objectContaining({ name: 'children', count: 1 }),
      ]),
    })
  })

  it('does not fallback-count primitive names shadowed by other imports', async () => {
    const components = await observeProject({
      'src/App.tsx': `
        import { Div } from '@reference-ui/react'
        import { Code } from './local-code'

        export function App() {
          return (
            <Div>
              <Code>not a Reference UI primitive</Code>
            </Div>
          )
        }
      `,
      'src/local-code.tsx': `export function Code(props: { children: string }) { return props.children }`,
    })

    expect(components.some(component => component.name === 'Code')).toBe(false)
    expect(components.some(component => component.name === 'Div')).toBe(true)
  })

  it('maps brace, arrow and bare attributes to exactly the props passed', async () => {
    const components = await observeApp(`
      import { Button } from '@reference-ui/react'

      export function App() {
        return <Button style={{a:{b:1}}} onClick={() => go()} disabled />
      }
    `)

    const button = components.find(component => component.name === 'Button')
    expect(observedPropNames(button)).toEqual(['disabled', 'onClick', 'style'])
    expect(button?.props.filter(prop => prop.count > 0).every(prop => prop.count === 1)).toBe(true)
  })

  it('keeps the as prop as real usage and maps observed prop values', async () => {
    const components = await observeApp(`
      import { Div } from '@reference-ui/react'

      export function App() {
        return <Div as="section" display="flex">x</Div>
      }
    `)

    const div = components.find(component => component.name === 'Div')
    expect(div?.props.find(prop => prop.name === 'as')).toMatchObject({
      count: 1,
      origin: 'observed',
      values: { section: 'very common' },
    })
    expect(div?.props.find(prop => prop.name === 'display')).toMatchObject({
      count: 1,
      origin: 'observed',
      styleProp: true,
      values: { flex: 'very common' },
    })
  })

  it('leaves primitives Atlas did not observe out of the list', async () => {
    const components = await observeApp(`
      import { Div } from '@reference-ui/react'

      export function App() {
        return <Div />
      }
    `)

    expect(components.map(component => component.name)).toEqual(['Div'])
    expect(findReferenceUiPrimitive('Code')).toMatchObject({ count: 0, usage: 'unused' })
  })
})
