/**
 * ATL package-scan pin (fortify A): a resolved included package whose
 * discovery fails surfaces ATL-W-PACKAGE-SCAN-FAILED naming the package,
 * while healthy siblings still index.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { analyzeDetailed } from '../js/index.js'

const scratch: string[] = []
afterEach(() => {
  for (const dir of scratch.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe('atlas package scan failure', () => {
  it('ATL-PKG-SCAN-01 unreadable include warns naming the package; siblings index', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-pkg-scan-'))
    scratch.push(root)
    const app = path.join(root, 'app')
    const badPkg = path.join(root, 'uilib', 'src')
    const goodPkg = path.join(root, 'otherlib', 'src')
    fs.mkdirSync(app, { recursive: true })
    fs.mkdirSync(badPkg, { recursive: true })
    fs.mkdirSync(goodPkg, { recursive: true })
    fs.writeFileSync(
      path.join(app, 'index.tsx'),
      'export function App() { return <div/> }\n'
    )
    fs.writeFileSync(
      path.join(badPkg, 'index.tsx'),
      'export function Thing() { return <span/> }\n'
    )
    fs.writeFileSync(
      path.join(goodPkg, 'index.tsx'),
      'export function Widget() { return <span/> }\n'
    )
    const lockedDir = path.join(badPkg, 'locked')
    fs.mkdirSync(lockedDir, { recursive: true })
    fs.writeFileSync(
      path.join(lockedDir, 'x.tsx'),
      'export function X() { return <i/> }\n'
    )
    fs.chmodSync(lockedDir, 0o000)
    try {
      const res = await analyzeDetailed(app, {
        include: ['@probe/uilib', '@probe/otherlib'],
        exclude: ['**/node_modules/**'],
      })
      const rows = res.diagnostics.filter(d => d.code === 'ATL-W-PACKAGE-SCAN-FAILED')
      expect(rows.length).toBe(1)
      expect(rows[0]?.message).toContain('@probe/uilib')
      expect(res.components.map(c => c.name)).toContain('Widget')
    } finally {
      fs.chmodSync(lockedDir, 0o755)
    }
  })
})
