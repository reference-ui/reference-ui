import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { collectReferenceUiPrimitiveUsage } from './primitive-usage'

let cwd: string | null = null

async function createFixture(source: string): Promise<string> {
  cwd = await mkdtemp(join(tmpdir(), 'reference-ui-mcp-primitives-'))
  await writeFile(join(cwd, 'App.tsx'), source)
  return cwd
}

describe('collectReferenceUiPrimitiveUsage', () => {
  afterEach(async () => {
    if (cwd) {
      await rm(cwd, { recursive: true, force: true })
      cwd = null
    }
  })

  it('detects directly imported Code primitive usage', async () => {
    const root = await createFixture(`
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

    const observations = await collectReferenceUiPrimitiveUsage(root, {
      name: 'test',
      include: ['App.tsx'],
    })

    expect(observations.find(observation => observation.name === 'Code')).toMatchObject({
      count: 2,
      examples: [
        '<Code>src/App.tsx</Code>',
        '<Code>ui.config.ts</Code>',
      ],
      propCounts: { children: 2 },
    })
  })

  it('falls back to JSX primitive names when the file references Reference UI', async () => {
    const root = await createFixture(`
      import { Div } from '@reference-ui/react'

      export function App() {
        return (
          <Div>
            <Code>src/App.tsx</Code>
          </Div>
        )
      }
    `)

    const observations = await collectReferenceUiPrimitiveUsage(root, {
      name: 'test',
      include: ['App.tsx'],
    })

    expect(observations.find(observation => observation.name === 'Code')).toMatchObject({
      count: 1,
      examples: ['<Code>src/App.tsx</Code>'],
      propCounts: { children: 1 },
    })
  })

  it('does not fallback-count primitive names shadowed by other imports', async () => {
    const root = await createFixture(`
      import { Div } from '@reference-ui/react'
      import { Code } from './local-code'

      export function App() {
        return (
          <Div>
            <Code>not a Reference UI primitive</Code>
          </Div>
        )
      }
    `)

    const observations = await collectReferenceUiPrimitiveUsage(root, {
      name: 'test',
      include: ['App.tsx'],
    })

    expect(observations.some(observation => observation.name === 'Code')).toBe(false)
  })
})
