/**
 * Isolated proof for `destination/resolve`: container resolution and owner
 * document derivation through their own exports, with no component mount.
 * The no-`window` server branch stays covered by the PT-ENV-01 SSR
 * renderToString test instead — this suite runs with DOM globals present.
 */
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { resolveContainer, destinationDocument } from './resolve'

describe('resolveContainer', () => {
  it('defaults omitted and explicit-null containers to document.body', () => {
    expect(resolveContainer(undefined)).toBe(document.body)
    expect(resolveContainer(null)).toBe(document.body)
  })

  it('reads ref objects, including the unresolved null ref', () => {
    const target = document.createElement('section')
    const fragment = document.createDocumentFragment()
    expect(resolveContainer({ current: target })).toBe(target)
    expect(resolveContainer({ current: fragment })).toBe(fragment)
    expect(resolveContainer({ current: null })).toBeNull()
  })

  it('calls resolver functions and honors their null', () => {
    const target = document.createElement('div')
    expect(resolveContainer(() => target)).toBe(target)
    expect(resolveContainer(() => null)).toBeNull()
  })

  it('accepts direct elements and detached fragments', () => {
    const element = document.createElement('main')
    const fragment = document.createDocumentFragment()
    expect(resolveContainer(element)).toBe(element)
    expect(resolveContainer(fragment)).toBe(fragment)
  })

  it('accepts cross-realm nodes by nodeType instead of instanceof (PT-ENV-04)', () => {
    // An iframe element fails this realm's `instanceof Element`; the
    // resolver must trust the nodeType stamped on the node itself.
    const foreignElement = { nodeType: 1 } as unknown as Element
    const foreignFragment = { nodeType: 11 } as unknown as DocumentFragment
    expect(resolveContainer(foreignElement)).toBe(foreignElement)
    expect(resolveContainer(foreignFragment)).toBe(foreignFragment)
  })

  it('rejects non-destination nodes with null', () => {
    expect(resolveContainer(document.createTextNode('text') as unknown as Element)).toBeNull()
    expect(resolveContainer({ nodeType: 3 } as unknown as Element)).toBeNull()
  })
})

describe('destinationDocument', () => {
  it('returns the owner document of elements and fragments', () => {
    expect(destinationDocument(document.createElement('div'))).toBe(document)
    expect(destinationDocument(document.createDocumentFragment())).toBe(document)
  })

  it('returns a Document node as its own destination document', () => {
    // happy-dom's `document` does not satisfy its own realm's
    // `instanceof Document`, so prove the branch with a node that does.
    const docNode = Object.create(Document.prototype) as unknown as Element
    expect(destinationDocument(docNode)).toBe(docNode)
  })

  it('falls back to null when the node has no owner document', () => {
    expect(
      destinationDocument({ nodeType: 1, ownerDocument: null } as unknown as Element),
    ).toBeNull()
  })
})
