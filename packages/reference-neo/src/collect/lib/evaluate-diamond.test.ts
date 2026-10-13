// Diamond evaluation over named fragment nodes, end to end through the evaluator.
// It takes two branches that publish one shared base as the same node, and asserts that each
// branch's override survives in either extends order, with the shared base evaluated once.

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ReferenceUIConfig } from '../../config/types.ts'
import { evaluateFragments } from './evaluate.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-diamond-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

function configWith(overrides: Partial<ReferenceUIConfig> = {}): ReferenceUIConfig {
  return { name: 'test-system', include: ['theme/**/*.{ts,tsx}'], ...overrides }
}

// A file that scans as a fragment source but holds no tokens of its own.
const PLAIN_FILE = 'export const notAFragments = 1\n'

// Named nodes as a published diamond carries them: the shared base once, then each branch.
const BASE_NODE = { name: 'base', bundle: "tokens({ colors: { x: { value: '#aa0000' }, y: { value: '#aa0001' } } })" }
const B_NODE = { name: 'branch-b', bundle: "tokens({ colors: { x: { value: '#bb0000' } } })" }
const C_NODE = { name: 'branch-c', bundle: "tokens({ colors: { y: { value: '#cc0001' } } })" }
const BRANCH_B = {
  name: 'branch-b',
  fragment: `${BASE_NODE.bundle}\n${B_NODE.bundle}`,
  fragments: [BASE_NODE, B_NODE],
}
const BRANCH_C = {
  name: 'branch-c',
  fragment: `${BASE_NODE.bundle}\n${C_NODE.bundle}`,
  fragments: [BASE_NODE, C_NODE],
}

describe('evaluateFragments diamond', () => {
  it.each([
    ['D on [B, C]', [BRANCH_B, BRANCH_C]],
    ['D on [C, B]', [BRANCH_C, BRANCH_B]],
  ])('keeps each branch override in %s, with the shared base evaluated once', async (_label, extendsList) => {
    const dir = await writeProject({ 'theme/tokens.ts': PLAIN_FILE })

    const spec = await evaluateFragments(dir, configWith({ extends: extendsList }))

    expect(spec.tokens).toEqual({
      colors: {
        x: { value: '#bb0000' },
        y: { value: '#cc0001' },
      },
    })
  })
})
