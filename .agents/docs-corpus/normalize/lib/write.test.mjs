/**
 * Write tests: the staged swap leaves the old folder whole on failure, drops
 * files the new build no longer has, and the index rebuild concatenates
 * per-source indexes in source order. `node --test .agents/docs-corpus/normalize/lib/*.test.mjs`
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rebuildIndex, writeSource } from './write.mjs'

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'normalize-write-'))
  return { root, out: join(root, 'out'), staging: join(root, 'staging'), done: () => rmSync(root, { recursive: true, force: true }) }
}

const row = (id, order) => ({ id, source: 'src', order })

describe('writeSource', () => {
  it('replaces a source folder and drops the files the new build no longer has', () => {
    const box = sandbox()
    try {
      writeSource({
        out: box.out,
        staging: box.staging,
        name: 'src',
        files: [
          { rel: 'src/a.md', text: 'old a' },
          { rel: 'src/gone.md', text: 'old gone' },
        ],
        rows: [row('src:a', 1)],
      })
      writeSource({
        out: box.out,
        staging: box.staging,
        name: 'src',
        files: [{ rel: 'src/a.md', text: 'new a' }],
        rows: [row('src:a', 1)],
      })
      assert.equal(readFileSync(join(box.out, 'src', 'a.md'), 'utf8'), 'new a')
      assert.equal(existsSync(join(box.out, 'src', 'gone.md')), false)
      assert.deepEqual(readdirSync(box.staging), [], 'nothing is left in staging')
    } finally {
      box.done()
    }
  })

  it('leaves the old folder whole when staging fails', () => {
    const box = sandbox()
    try {
      writeSource({
        out: box.out,
        staging: box.staging,
        name: 'src',
        files: [{ rel: 'src/a.md', text: 'old a' }],
        rows: [row('src:a', 1)],
      })
      // a.md is a file, so writing a.md/child.md cannot succeed
      assert.throws(() =>
        writeSource({
          out: box.out,
          staging: box.staging,
          name: 'src',
          files: [
            { rel: 'src/a.md', text: 'new a' },
            { rel: 'src/a.md/child.md', text: 'new child' },
          ],
          rows: [row('src:a', 1)],
        })
      )
      assert.equal(readFileSync(join(box.out, 'src', 'a.md'), 'utf8'), 'old a')
      assert.deepEqual(readdirSync(box.staging), [], 'the failed stage is removed')
    } finally {
      box.done()
    }
  })

  it('writes a source that has no pages, with an empty index', () => {
    const box = sandbox()
    try {
      writeSource({ out: box.out, staging: box.staging, name: 'src', files: [], rows: [] })
      assert.equal(readFileSync(join(box.out, 'src', 'pages.jsonl'), 'utf8'), '')
    } finally {
      box.done()
    }
  })
})

describe('rebuildIndex', () => {
  it('concatenates per-source indexes in source order, ignoring other files', () => {
    const box = sandbox()
    try {
      mkdirSync(join(box.out, 'beta'), { recursive: true })
      mkdirSync(join(box.out, 'alpha'), { recursive: true })
      writeFileSync(join(box.out, 'beta', 'pages.jsonl'), `${JSON.stringify(row('beta:x', 1))}\n`)
      writeFileSync(join(box.out, 'alpha', 'pages.jsonl'), `${JSON.stringify(row('alpha:a', 1))}\n${JSON.stringify(row('alpha:b', 2))}\n`)
      writeFileSync(join(box.out, 'pages.jsonl'), 'stale combined content\n')
      mkdirSync(join(box.out, 'no-index'), { recursive: true })
      const result = rebuildIndex(box.out)
      assert.deepEqual(result, { rows: 3, sources: 2 })
      const ids = readFileSync(join(box.out, 'pages.jsonl'), 'utf8')
        .trim()
        .split('\n')
        .map(line => JSON.parse(line).id)
      assert.deepEqual(ids, ['alpha:a', 'alpha:b', 'beta:x'])
    } finally {
      box.done()
    }
  })
})
