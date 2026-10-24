#!/usr/bin/env node

/**
 * Pins how `pnpm agentrs q` sorts its positional arguments: source files are
 * kept, an existing non-source file is reported as skipped (never dropped
 * silently), and a missing path is reported as unresolved.
 * Run with: node --test .agents/skills/agent-rs/scripts/quality-targets.test.mjs
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { resolvePositionalTargets } from './quality-targets.mjs'

const EXTENSIONS = ['.rs', '.ts']

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrs-q-'))
  fs.writeFileSync(path.join(dir, 'a.rs'), 'fn a() {}\n')
  fs.writeFileSync(path.join(dir, 'notes.md'), '# notes\n')
  fs.mkdirSync(path.join(dir, 'sub'))
  fs.writeFileSync(path.join(dir, 'sub', 'b.ts'), 'export const b = 1\n')
  return dir
}

test('a non-source file next to a source file is reported as skipped, not dropped silently', (t) => {
  const dir = fixture()
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const result = resolvePositionalTargets([path.join(dir, 'a.rs'), path.join(dir, 'notes.md')], dir, EXTENSIONS)
  assert.deepEqual(result.files, [path.join(dir, 'a.rs')])
  assert.deepEqual(result.skipped, [{ raw: path.join(dir, 'notes.md'), path: path.join(dir, 'notes.md') }])
  assert.deepEqual(result.unresolved, [])
})

test('a directory expands to its source files and a missing path is unresolved', (t) => {
  const dir = fixture()
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const result = resolvePositionalTargets([path.join(dir, 'sub'), path.join(dir, 'missing.rs')], dir, EXTENSIONS)
  assert.deepEqual(result.files, [path.join(dir, 'sub', 'b.ts')])
  assert.deepEqual(result.skipped, [])
  assert.deepEqual(result.unresolved, [path.join(dir, 'missing.rs')])
})
