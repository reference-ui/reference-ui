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
import { loadUserConfigWithDependencies } from './load.ts'

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
    // The bare upstream is inlined but is not a watch input, as it never was.
    expect(second.dependencyPaths).toEqual([realpathSync(configPath)])
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
})
