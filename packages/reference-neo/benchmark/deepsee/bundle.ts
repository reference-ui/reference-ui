// Combined bundle accountant over one synced `.reference-ui` output dir.
// It takes the out dir, runs the CSS and runtime-data accountants, and prints
// the attribution tables plus the reconciliation proof. Both files must
// reconcile to the byte or the run fails: attribution that does not sum to
// the shipped bytes is a bug in the tool, never a rounding note.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { accountStylesheet, flattenLayers, type CssLayerNode } from './bundle-css.ts'
import { accountRuntimeData } from './bundle-data.ts'

export interface BundleReport {
  outDir: string
  cssBytes: number
  cssGzip: number
  dataBytes: number
  dataGzip: number
  cssResidual: number
  dataResidual: number
  markdown: string
}

function kb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '—'
  return `${((part / whole) * 100).toFixed(1)}%`
}

function cssTable(root: CssLayerNode[], total: number): string[] {
  const lines = ['| layer | bytes | share | blocks |', '| --- | --- | --- | --- |']
  const visit = (nodes: CssLayerNode[]): void => {
    for (const node of nodes) {
      const indent = node.depth === 0 ? '' : `${'↳ '.padStart(node.depth * 2 + 2, ' ')}`
      const blocks = node.classes.reduce((n, c) => n + c.blocks, 0)
      lines.push(`| ${indent}\`${node.name}\` | ${kb(node.bytes)} | ${pct(node.bytes, total)} | ${blocks} |`)
      visit(node.children)
    }
  }
  visit(root)
  return lines
}

function classTable(nodes: CssLayerNode[]): string[] {
  const lines = ['| layer / class | bytes | blocks |', '| --- | --- | --- |']
  for (const node of flattenLayers(nodes)) {
    for (const cls of node.classes) {
      lines.push(`| ${node.name} / ${cls.name} | ${kb(cls.bytes)} | ${cls.blocks} |`)
    }
  }
  return lines
}

export function accountBundle(outDir: string): BundleReport {
  const cssPath = join(outDir, 'styled', 'styles.css')
  const dataPath = join(outDir, 'styled', 'runtime-data.mjs')
  const cssText = readFileSync(cssPath, 'utf-8')
  const dataText = readFileSync(dataPath, 'utf-8')
  const css = accountStylesheet(cssText)
  const data = accountRuntimeData(dataText)
  const cssGzip = gzipSync(cssText).length
  const dataGzip = gzipSync(dataText).length

  const lines: string[] = []
  lines.push(`## bundle accounting — \`${outDir}\``, '')
  lines.push(`- styles.css: ${kb(css.bytes)} (${cssGzip} B gzip)`)
  lines.push(`- runtime-data.mjs: ${kb(data.bytes)} (${dataGzip} B gzip)`)
  lines.push('')
  lines.push('### styles.css by layer', '')
  lines.push(...cssTable(css.layers, css.bytes))
  lines.push('')
  lines.push(`header/unlayered: ${kb(css.headerBytes)} · inter-layer seams: ${kb(css.seamBytes)}`)
  lines.push('')
  lines.push('### styles.css block classes', '')
  lines.push(...classTable(css.layers))
  lines.push('')
  lines.push('### runtime-data.mjs by table', '')
  lines.push('| table | bytes | share |', '| --- | --- | --- |')
  for (const table of [...data.tables].sort((a, b) => b.bytes - a.bytes)) {
    lines.push(`| \`${table.key}\` | ${kb(table.bytes)} | ${pct(table.bytes, data.blobBytes)} |`)
  }
  lines.push(`| \`(envelope)\` | ${kb(data.envelopeBytes)} | ${pct(data.envelopeBytes, data.bytes)} |`)
  lines.push('')
  lines.push('### runtime-data.mjs recipes detail', '')
  lines.push(`entries: ${data.recipes.entries} · table bytes: ${kb(data.recipes.bytes)}`)
  lines.push('')
  lines.push('| field (all entries) | bytes | share of table |', '| --- | --- | --- |')
  for (const field of data.recipes.fields) {
    lines.push(`| \`${field.field}\` | ${kb(field.bytes)} | ${pct(field.bytes, data.recipes.bytes)} |`)
  }
  lines.push('')
  lines.push('### runtime-data.mjs namer detail', '')
  lines.push('| namer table | bytes |', '| --- | --- |')
  for (const entry of [...data.namer].sort((a, b) => b.bytes - a.bytes)) {
    lines.push(`| \`${entry.key}\` | ${kb(entry.bytes)} |`)
  }
  lines.push('')
  lines.push('### reconciliation', '')
  lines.push('| file | shipped | accounted | residual |', '| --- | --- | --- | --- |')
  lines.push(`| styles.css | ${css.bytes} | ${css.accounted} | ${css.residual} |`)
  lines.push(`| runtime-data.mjs | ${data.bytes} | ${data.accounted} | ${data.residual} |`)
  lines.push('')
  if (css.residual !== 0 || data.residual !== 0) {
    throw new Error(`bundle accounting does not reconcile (css ${css.residual}, data ${data.residual})`)
  }
  lines.push('Reconciled to the byte.')
  return {
    outDir,
    cssBytes: css.bytes,
    cssGzip,
    dataBytes: data.bytes,
    dataGzip,
    cssResidual: css.residual,
    dataResidual: data.residual,
    markdown: lines.join('\n'),
  }
}
