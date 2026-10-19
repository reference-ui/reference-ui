/**
 * Section tests: heading text as the index reads it. A link in a heading keeps
 * its label, so the target never adds words, and the slug is unchanged.
 * `node --test .agents/docs-corpus/normalize/lib/*.test.mjs`
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { plainHeading, scanHeadings, slugify, splitSections } from './sections.mjs'

describe('plainHeading', () => {
  it('keeps a link label and drops its target', () => {
    assert.equal(plainHeading('[Light and Dark Mode](#light-and-dark-mode)'), 'Light and Dark Mode')
    assert.equal(
      plainHeading('Simulating [`round()`](https://developer.mozilla.org/en-US/docs/Web/CSS/round)'),
      'Simulating `round()`'
    )
    assert.equal(plainHeading('  Plain heading  '), 'Plain heading')
  })
})

describe('scanHeadings', () => {
  it('reads link-free heading text outside fenced code', () => {
    const lines = ['## [Light and Dark Mode](#light-and-dark-mode)', 'prose', '```', '## not a heading', '```']
    assert.deepEqual(scanHeadings(lines).map(h => h.text), ['Light and Dark Mode'])
  })

  it('leaves slugs as they were', () => {
    assert.equal(slugify('[Light and Dark Mode](#light-and-dark-mode)'), 'light-and-dark-mode')
    assert.equal(slugify('Light and Dark Mode'), 'light-and-dark-mode')
  })
})

describe('splitSections', () => {
  it('titles a section with the plain heading', () => {
    const body = '## [Light and Dark Mode](#light-and-dark-mode)\n\nSome text.\n'
    const [section] = splitSections(body, { pageTitle: 'Figma' })
    assert.equal(section.heading, 'Light and Dark Mode')
    assert.equal(section.title, 'Figma › Light and Dark Mode')
  })
})
