import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface MockComponentDef {
  name: string
  props?: string[]
}

export interface MockProjectOptions {
  components?: MockComponentDef[]
  hasArtifacts?: boolean
  brokenConfig?: boolean
  invalidJsonArtifact?: boolean
}

export function createMockProjectArtifact(projectDir: string, components: MockComponentDef[] = []) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    workspaceRoot: projectDir,
    components: components.map(c => ({
      name: c.name,
      kind: 'project' as const,
      source: `src/components/${c.name}.tsx`,
      count: 1,
      usage: { count: 1, locations: [] },
      usedWith: {},
      examples: [`<${c.name} />`],
      interface: {
        name: `${c.name}Props`,
        source: `src/components/${c.name}.tsx`,
      },
      props: (c.props ?? ['id']).map(p => ({
        name: p,
        count: 1,
        usage: { count: 1, locations: [] },
        type: 'string',
        description: `${p} property`,
        optional: true,
        readonly: false,
        origin: 'observed' as const,
      })),
    })),
  }
}

export function writeMockProject(projectDir: string, options: MockProjectOptions = {}) {
  mkdirSync(projectDir, { recursive: true })

  // 1. ui.config.ts
  const configPath = join(projectDir, 'ui.config.ts')
  if (options.brokenConfig) {
    writeFileSync(configPath, 'export default { broken syntax ::::', 'utf8')
  } else {
    writeFileSync(configPath, "export default { name: 'test-system', include: ['src/**/*.{ts,tsx}'] }\n", 'utf8')
  }

  // 2. Artifacts (.reference-ui/mcp/model.json)
  if (options.hasArtifacts !== false) {
    const modelDir = join(projectDir, '.reference-ui', 'mcp')
    mkdirSync(modelDir, { recursive: true })
    const modelPath = join(modelDir, 'model.json')

    if (options.invalidJsonArtifact) {
      writeFileSync(modelPath, '{ invalid json', 'utf8')
    } else {
      const artifact = createMockProjectArtifact(projectDir, options.components ?? [])
      writeFileSync(modelPath, JSON.stringify(artifact, null, 2), 'utf8')
    }
  }
}

export function createMultiProjectWorkspace(
  workspaceRoot: string,
  packages: Record<string, MockProjectOptions>,
) {
  mkdirSync(workspaceRoot, { recursive: true })

  // pnpm-workspace.yaml
  const yamlContent = `packages:\n  - 'packages/*'\n`
  writeFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), yamlContent, 'utf8')

  // package.json for workspace
  writeFileSync(
    join(workspaceRoot, 'package.json'),
    JSON.stringify({ name: 'test-workspace', private: true }, null, 2),
    'utf8',
  )

  const createdPaths: Record<string, string> = {}
  for (const [pkgName, pkgOptions] of Object.entries(packages)) {
    const pkgDir = join(workspaceRoot, 'packages', pkgName)
    writeMockProject(pkgDir, pkgOptions)
    createdPaths[pkgName] = pkgDir
  }

  return createdPaths
}
