/**
 * Records tests: a normalized file becomes one flat memex record with lists
 * flattened to words and the body kept, a file without an id is skipped, and
 * the writer collects every source folder into one docs array.
 * `node --test .agents/docs-corpus/normalize/lib/*.test.mjs`
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { RECORDS, recordOf, writeRecords } from './records.mjs'

const PAGE = '---\nid: src:a\nsource: src\ntitle: A, the page\nconcepts: [tokens, theming]\n---\n# A\n\nBody text.\n'

describe('recordOf', () => {
  it('keeps scalar fields as written, flattens lists to words, and keeps the body', () => {
    assert.deepEqual(recordOf(PAGE, 'out/src/a.md'), {
      id: 'src:a',
      title: 'A, the page',
      concepts: 'tokens theming',
      source: 'src',
      file: 'out/src/a.md',
      body: '# A\n\nBody text.',
    })
  })

  it('skips a file with no id', () => {
    assert.equal(recordOf('# No frontmatter\n', 'x.md'), null)
  })
})

describe('writeRecords', () => {
  it('collects every source folder into one docs array and ignores top-level files', () => {
    const root = mkdtempSync(join(tmpdir(), 'normalize-records-'))
    try {
      const out = join(root, 'out')
      mkdirSync(join(out, 'src', 'a.sections'), { recursive: true })
      writeFileSync(join(out, 'src', 'a.md'), PAGE)
      writeFileSync(join(out, 'src', 'a.sections', 'b.md'), PAGE.replace('id: src:a', 'id: src:a#b'))
      writeFileSync(join(out, 'pages.jsonl'), '')
      const result = writeRecords(out, root)
      const { docs } = JSON.parse(readFileSync(join(out, RECORDS), 'utf8'))
      assert.equal(result.count, 2)
      assert.deepEqual(docs.map(doc => doc.id).sort(), ['src:a', 'src:a#b'])
      assert.ok(docs.every(doc => doc.file.startsWith('out/src/')))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
