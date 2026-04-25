import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  findTextContent,
  parseTextJson,
  referenceUnitRoot,
  runRefSync,
  startMcpClient,
  stopMcpClient,
  warmMcpArtifact,
  type RunningMcpClient,
} from './helpers'

const fixtureRoot = resolve(referenceUnitRoot, '..', '..', 'fixtures', 'atlas-project')
const modelPath = join(fixtureRoot, '.reference-ui', 'mcp', 'model.json')

let running: RunningMcpClient | null = null

describe('mcp output wiring', { timeout: 120_000 }, () => {
  beforeAll(async () => {
    rmSync(modelPath, { force: true })
    expect(existsSync(modelPath)).toBe(false)

    runRefSync(fixtureRoot)
    expect(existsSync(modelPath)).toBe(false)

    running = await startMcpClient(fixtureRoot, 3698)
    await warmMcpArtifact(running.client)
    expect(existsSync(modelPath)).toBe(true)
  }, 120_000)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('emits MCP output for included fixture-library components and excludes filtered ones', async () => {
    const artifact = JSON.parse(readFileSync(modelPath, 'utf8')) as {
      schemaVersion: string
      components: Array<{ name: string; source: string }>
    }

    expect(artifact.schemaVersion).toBeTruthy()
    expect(artifact.components.length).toBeGreaterThan(0)
    expect(
      artifact.components.some(
        component =>
          component.name === 'Button' && component.source === './components/Button.tsx'
      )
    ).toBe(true)
    expect(
      artifact.components.some(
        component =>
          component.name === 'AppCard' && component.source === './components/AppCard.tsx'
      )
    ).toBe(true)
    expect(artifact.components.some(component => component.name === 'UserBadge')).toBe(
      false
    )

    const listResult = await running!.client.callTool({
      name: 'list_components',
      arguments: { source: './components/Button.tsx' },
    })
    const listText = findTextContent(listResult)

    expect(listText).toContain('Button')
    expect(listText).not.toContain('UserBadge')

    const buttonResult = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'Button', source: './components/Button.tsx' },
    })
    const buttonText = findTextContent(buttonResult)

    expect(buttonText).toContain('"name": "Button"')
    expect(buttonText).toContain('"source": "./components/Button.tsx"')
    expect(buttonText).toContain('"source": "@fixtures/demo-ui"')
  })

  it('persists the MCP artifact on disk after the server builds it', () => {
    const artifact = JSON.parse(readFileSync(modelPath, 'utf8')) as {
      components: Array<{ name: string; source: string }>
    }

    expect(existsSync(modelPath)).toBe(true)
    expect(
      artifact.components.some(
        component =>
          component.name === 'Button' && component.source === './components/Button.tsx'
      )
    ).toBe(true)
  })

  it('supports the remaining MCP tools with usable project-aware payloads', async () => {
    const appCard = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'AppCard', source: './components/AppCard.tsx' },
    })
    const appCardPayload = parseTextJson<{
      name: string
      props: Array<{ name: string; type: string | null }>
      propSummary: { total: number; returned: number }
      interface: { name: string; source: string } | null
    }>(appCard)

    expect(appCardPayload?.name).toBe('AppCard')
    expect(appCardPayload?.interface?.name).toBe('AppCardProps')
    expect(appCardPayload?.propSummary.total).toBeGreaterThanOrEqual(
      appCardPayload?.propSummary.returned ?? 0
    )
    expect(
      appCardPayload?.props.some(
        prop => prop.name === 'status' && prop.type === 'BadgeVariant'
      )
    ).toBe(true)

    const appCardProps = await running!.client.callTool({
      name: 'get_component_props',
      arguments: { name: 'AppCard', source: './components/AppCard.tsx' },
    })
    const appCardPropsPayload = parseTextJson<{
      name: string
      props: Array<{ name: string; type: string | null }>
    }>(appCardProps)

    expect(appCardPropsPayload?.name).toBe('AppCard')
    expect(
      appCardPropsPayload?.props.some(
        prop => prop.name === 'status' && prop.type === 'BadgeVariant'
      )
    ).toBe(true)

    const examplesResult = await running!.client.callTool({
      name: 'get_component_examples',
      arguments: { name: 'AppCard', source: './components/AppCard.tsx' },
    })
    const examplesPayload = parseTextJson<{
      name: string
      examples: string[]
    }>(examplesResult)

    expect(examplesPayload?.name).toBe('AppCard')
    expect(examplesPayload?.examples.length).toBeGreaterThan(0)
    expect(
      examplesPayload?.examples.some(example => example.includes('Preferences'))
    ).toBe(true)

    const patternsResult = await running!.client.callTool({
      name: 'get_common_patterns',
      arguments: { name: 'Button', source: './components/Button.tsx' },
    })
    const patternsPayload = parseTextJson<{
      name: string
      patterns: Array<{ name: string; usage: string }>
    }>(patternsResult)

    expect(patternsPayload?.name).toBe('Button')
    expect(patternsPayload?.patterns.some(pattern => pattern.name === 'AppCard')).toBe(
      true
    )

    const styleProps = await running!.client.callTool({
      name: 'get_style_props',
      arguments: { query: 'color' },
    })
    const stylePropsPayload = parseTextJson<{
      categories: Array<{ name: string; tokenCategories: string[] }>
    }>(styleProps)

    expect(stylePropsPayload?.categories.some(category => category.name === 'color')).toBe(
      true
    )

    const tokens = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { limit: 10 },
    })
    const tokensPayload = parseTextJson<{ tokens: Array<{ path: string }> }>(tokens)

    expect(Array.isArray(tokensPayload?.tokens)).toBe(true)
  })

  it('returns explicit MCP tool errors for unknown components', async () => {
    const missing = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'MissingComponent' },
    })

    expect((missing as { isError?: boolean }).isError).toBe(true)
    expect(findTextContent(missing)).toContain('Component not found: MissingComponent')
  })
})
