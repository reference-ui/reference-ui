// Unit tests for Neo config loads repeated in one process.
// They take a temp consumer whose config imports an upstream base system by bare
// package specifier, change the upstream between two loads, and assert the second
// load reads the current file. The upstream is linked into node_modules the way a
// workspace package is, so its real path sits outside node_modules.

import { realpathSync } from 'node:fs'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleConfig } from './bundle.ts'
import { getAttemptedUserConfigDependencies, loadUserConfigWithDependencies } from './load.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

interface Consumer {
  app: string
  upstreamFile: string
}

// A consumer app beside a sibling upstream package. node_modules links the upstream
// in, as a workspace link does, so its real file is outside node_modules.
async function makeConsumer(): Promise<Consumer> {
  const root = await mkdtemp(join(tmpdir(), 'reference-ui-config-reload-'))
  tempDirs.push(root)
  const upstream = join(root, 'upstream', 'fake-up')
  const app = join(root, 'app')
  await mkdir(upstream, { recursive: true })
  await mkdir(join(app, 'node_modules'), { recursive: true })
  await writeFile(
    join(upstream, 'package.json'),
    JSON.stringify({
      name: 'fake-up',
      type: 'module',
      exports: { './baseSystem': { types: './baseSystem.d.mts', import: './baseSystem.mjs' } },
    }),
  )
  await symlink(upstream, join(app, 'node_modules', 'fake-up'), 'dir')
  return { app, upstreamFile: join(upstream, 'baseSystem.mjs') }
}

// The published shape: a plain data export, as sync writes it to baseSystem.mjs.
function baseSystemModule(fragment: string): string {
  return `export const baseSystem = ${JSON.stringify({ name: 'fake-up', fragment })}\n`
}

describe('config loads in one process', () => {
  it('reads the current upstream base system on every load', async () => {
    const { app, upstreamFile } = await makeConsumer()
    await writeFile(upstreamFile, baseSystemModule('ink: v1'))
    const configPath = join(app, 'ui.config.ts')
    await writeFile(
      configPath,
      [
        "import { baseSystem } from 'fake-up/baseSystem'",
        '',
        'export default {',
        "  name: 'fake-app',",
        "  include: ['src/**/*.{ts,tsx}'],",
        '  extends: [baseSystem],',
        '}',
        '',
      ].join('\n'),
    )

    const first = await loadUserConfigWithDependencies(app)
    expect(first.config.extends?.[0]?.fragment).toBe('ink: v1')

    await writeFile(upstreamFile, baseSystemModule('ink: v2'))
    const second = await loadUserConfigWithDependencies(app)
    expect(second.config.extends?.[0]?.fragment).toBe('ink: v2')
    // The bare upstream is inlined, and its real file is a watch input, so its re-sync reaches this config.
    expect(second.dependencyPaths).toEqual([realpathSync(configPath), realpathSync(upstreamFile)].sort())
  })

  it('keeps other resolvable packages external', async () => {
    const { app } = await makeConsumer()
    const pkg = join(app, 'node_modules', 'plain-pkg')
    await mkdir(pkg, { recursive: true })
    await writeFile(
      join(pkg, 'package.json'),
      JSON.stringify({ name: 'plain-pkg', type: 'module', exports: './index.mjs' }),
    )
    await writeFile(join(pkg, 'index.mjs'), 'export const tag = "plain-value"\n')
    const configPath = join(app, 'ui.config.ts')
    await writeFile(
      configPath,
      ["import { tag } from 'plain-pkg'", "export default { name: 'fake-app', tag }", ''].join('\n'),
    )

    const bundled = await bundleConfig(configPath)

    expect(bundled).toMatch(/from ['"]plain-pkg['"]/)
    expect(bundled).not.toContain('plain-value')
  })

  it('leaves unresolvable and builtin imports external and keeps the neo alias', async () => {
    const { app } = await makeConsumer()
    const configPath = join(app, 'ui.config.ts')
    await writeFile(
      configPath,
      [
        "import { defineConfig } from '@reference-ui/neo'",
        "import { gone } from 'not-installed-anywhere'",
        "import { deep } from '@scope/missing/deep/path'",
        "import { sep } from 'node:path'",
        "export default defineConfig({ name: 'fake-app', include: [], gone, deep, sep })",
        '',
      ].join('\n'),
    )

    const bundled = await bundleConfig(configPath)

    // A specifier esbuild cannot resolve is Node's call at runtime, not a build error.
    expect(bundled).toMatch(/from ['"]not-installed-anywhere['"]/)
    expect(bundled).toMatch(/from ['"]@scope\/missing\/deep\/path['"]/)
    expect(bundled).toMatch(/from ['"]node:path['"]/)
    // The defineConfig id still maps to the local entry instead of staying a bare import.
    expect(bundled).not.toMatch(/from ['"]@reference-ui\/neo['"]/)
  })
})

describe('config loads that fail', () => {
  it('names the files a failed load tried to import, and forgets them after a good load', async () => {
    const { app } = await makeConsumer()
    const configPath = join(app, 'ui.config.ts')
    await writeFile(
      configPath,
      ["import { gone } from './missing/tokens.ts'", "export default { name: 'fake-app', include: [], gone }", ''].join('\n'),
    )

    await expect(loadUserConfigWithDependencies(app)).rejects.toThrow(/missing/)
    const attempted = getAttemptedUserConfigDependencies(app)
    expect(attempted.some((file) => file.endsWith(join('missing', 'tokens.ts')))).toBe(true)

    await writeFile(configPath, "export default { name: 'fake-app', include: [] }\n")
    await loadUserConfigWithDependencies(app)
    expect(getAttemptedUserConfigDependencies(app)).toEqual([])
  })
})
