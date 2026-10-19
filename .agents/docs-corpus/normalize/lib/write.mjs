/**
 * Writes one source's folder atomically, and rebuilds the combined index.
 *
 * A source is staged whole in a sibling staging directory, outside the tree
 * Memex reads, then swapped into place with two renames. Readers see the old
 * folder or the new one, never a missing or half-written one, apart from the
 * instant between the two renames. Memex skips entries that vanish mid-walk.
 */

import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'

export const INDEX = 'pages.jsonl'

export function rowsText(rows) {
  return rows.map(row => `${JSON.stringify(row)}\n`).join('')
}

/**
 * Replaces `<out>/<name>/` with `files` (paths relative to `<out>/`) and the
 * source's own index. Nothing in `<out>/<name>` changes until the new tree is
 * complete; a failure while staging leaves the old tree untouched.
 */
export function writeSource({ out, staging, name, files, rows }) {
  mkdirSync(staging, { recursive: true })
  const stage = join(staging, `${name}.${process.pid}`)
  const retired = join(staging, `${name}.${process.pid}.old`)
  rmSync(stage, { recursive: true, force: true })
  try {
    for (const file of files) {
      const abs = join(stage, file.rel.slice(name.length + 1))
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, file.text)
    }
    mkdirSync(stage, { recursive: true })
    writeFileSync(join(stage, INDEX), rowsText(rows))
  } catch (err) {
    rmSync(stage, { recursive: true, force: true })
    throw err
  }
  mkdirSync(out, { recursive: true })
  const target = join(out, name)
  rmSync(retired, { recursive: true, force: true })
  const hadOld = existsSync(target)
  if (hadOld) renameSync(target, retired)
  try {
    renameSync(stage, target)
  } catch (err) {
    if (hadOld) renameSync(retired, target)
    throw err
  }
  rmSync(retired, { recursive: true, force: true })
}

/**
 * Rebuilds `<out>/pages.jsonl` from every source's own index, concatenated in
 * source order. Written through a temp file. A source that is being swapped
 * right now is skipped; the next run picks it up.
 */
export function rebuildIndex(out) {
  const lines = []
  let sources = 0
  for (const dir of readdirSync(out).sort()) {
    let text
    try {
      text = readFileSync(join(out, dir, INDEX), 'utf8')
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') continue
      throw err
    }
    sources++
    for (const line of text.split('\n')) if (line) lines.push(line)
  }
  const target = join(out, INDEX)
  const tmp = `${target}.${process.pid}.tmp`
  writeFileSync(tmp, lines.map(line => `${line}\n`).join(''))
  renameSync(tmp, target)
  return { rows: lines.length, sources }
}
