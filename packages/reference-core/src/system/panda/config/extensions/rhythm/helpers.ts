import valueParser, { type Node } from 'postcss-value-parser'
import { getRhythm } from './get-rhythm'
export { getRhythm }

function parseRhythmFraction(value: string): [number, number] | undefined {
  const slashIndex = value.indexOf('/')
  if (slashIndex <= 0 || slashIndex !== value.lastIndexOf('/')) {
    return undefined
  }

  const numerator = Number(value.slice(0, slashIndex))
  const denominator = Number(value.slice(slashIndex + 1))
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return undefined
  }

  return [numerator, denominator]
}

function resolveSingleRhythmValue(value: string): string | undefined {
  if (!value.endsWith('r')) {
    return undefined
  }

  const rhythmValue = value.slice(0, -1)
  if (rhythmValue === '' || rhythmValue === '+') {
    return getRhythm(1)
  }
  if (rhythmValue === '-') {
    return 'calc(-1 * var(--spacing-root))'
  }

  const fraction = parseRhythmFraction(rhythmValue)
  if (fraction) {
    return getRhythm(fraction[0], fraction[1])
  }

  const n = Number(rhythmValue)
  if (!Number.isNaN(n)) {
    return getRhythm(n)
  }

  return undefined
}

function transformNodes(nodes: Node[]): boolean {
  let changed = false

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node.type === 'function') {
      const name = node.value.toLowerCase()
      if (name === 'var' || name === 'url' || name === 'env') {
        continue
      }
      if (node.nodes && node.nodes.length > 0) {
        if (transformNodes(node.nodes)) {
          changed = true
        }
      }
      continue
    }

    // Check fraction: e.g. 1/5r or -2/3r (tokenized as word, div '/', word '5r')
    const next = nodes[i + 1]
    const nextNext = nodes[i + 2]
    if (
      node.type === 'word' &&
      next?.type === 'div' &&
      next.value === '/' &&
      next.before === '' &&
      next.after === '' &&
      nextNext?.type === 'word' &&
      nextNext.value.endsWith('r') &&
      node.sourceEndIndex === next.sourceIndex &&
      next.sourceEndIndex === nextNext.sourceIndex
    ) {
      const prevNode = nodes[i - 1]
      const isInvalidPrefix =
        prevNode?.type === 'div' &&
        prevNode.value === '/' &&
        prevNode.after === ''

      if (!isInvalidPrefix) {
        const denomStr = nextNext.value.slice(0, -1)
        const fractionStr = `${node.value}/${denomStr}`
        const fraction = parseRhythmFraction(fractionStr)
        if (fraction) {
          const resolved = getRhythm(fraction[0], fraction[1])
          nodes.splice(i, 3, {
            type: 'word',
            sourceIndex: node.sourceIndex,
            sourceEndIndex: nextNext.sourceEndIndex,
            value: resolved,
          })
          changed = true
          continue
        }
      }
    }

    if (node.type === 'word') {
      const prevNode = nodes[i - 1]
      const isDirectSlashChild =
        prevNode?.type === 'div' &&
        prevNode.value === '/' &&
        prevNode.after === ''

      if (!isDirectSlashChild) {
        const resolved = resolveSingleRhythmValue(node.value)
        if (resolved !== undefined) {
          node.value = resolved
          changed = true
        }
      }
    }
  }

  return changed
}

/** Resolves rhythm strings like "2r" or "1/5r" to calc values, passthrough otherwise */
export function resolveRhythm(value: unknown): string | number {
  if (typeof value !== 'string') {
    return value as string | number
  }

  if (!value.includes('r')) {
    return value
  }

  const parsed = valueParser(value)
  const changed = transformNodes(parsed.nodes)
  return changed ? parsed.toString() : value
}
