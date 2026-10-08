// Element roster from the committed E1 vocabulary shelf.
// It takes the generated vocabulary.json beside this module and emits the
// platform dom tags plus their JSX names in shelf order. Shelf order is the
// contract: emitters and requests print the roster positionally, so the
// reader preserves it exactly and fails loudly on a malformed shelf instead
// of emitting a silent wrong roster.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** One roster row: the platform tag plus the component name the entry exports. */
export interface ElementNamePair {
  dom: string
  jsx: string
}

function readElementPair(element: unknown): ElementNamePair {
  if (typeof element !== 'object' || element === null) {
    throw new Error('[element-vocabulary] E1 vocabulary.json carries a malformed element')
  }
  const row = element as { dom?: unknown; jsx?: unknown }
  if (typeof row.dom !== 'string' || row.dom.length === 0) {
    throw new Error('[element-vocabulary] E1 vocabulary.json carries an element without a dom tag')
  }
  if (typeof row.jsx !== 'string' || row.jsx.length === 0) {
    throw new Error('[element-vocabulary] E1 vocabulary.json carries an element without a jsx name')
  }
  return { dom: row.dom, jsx: row.jsx }
}

function readElementRoster(): ElementNamePair[] {
  const shelf = JSON.parse(
    readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        'generated',
        'primitives',
        'vocabulary.json'
      ),
      'utf-8'
    )
  ) as unknown
  if (typeof shelf !== 'object' || shelf === null) {
    throw new Error('[element-vocabulary] E1 vocabulary.json is not an object')
  }
  const elements = (shelf as { elements?: unknown }).elements
  if (!Array.isArray(elements)) {
    throw new Error('[element-vocabulary] E1 vocabulary.json carries no elements array')
  }
  return elements.map(readElementPair)
}

/** Roster rows in E1 shelf order, for emitters that print tag and name together. */
export const ELEMENT_ROSTER: ReadonlyArray<ElementNamePair> = readElementRoster()

/** Platform dom tags in E1 shelf order. */
export const ELEMENT_DOM_TAGS: readonly string[] = ELEMENT_ROSTER.map(pair => pair.dom)

/** JSX component names in E1 shelf order, aligned with ELEMENT_DOM_TAGS. */
export const ELEMENT_JSX_NAMES: readonly string[] = ELEMENT_ROSTER.map(pair => pair.jsx)
