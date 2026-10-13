/**
 * Unit tests for the case-folder convention the station runner enforces.
 * Covers the case.json rules and the on-disk read in readCaseIndex against temporary
 * case folders, the stray-folder rule, and the README first-line heading, so a broken
 * folder fails here before any station runs.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  caseIndexProblems,
  readCaseIndex,
  readmeProblems,
  strayCaseFolders,
} from './caseIndex.js'

const ATOMIC_CASE = /^(ATM-[A-Z]+-\d{2})$/

describe('case.json convention', () => {
  let root = ''

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-case-index-'))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  function caseFolder(name: string, caseJson?: string): string {
    const dir = path.join(root, name)
    fs.mkdirSync(dir)
    if (caseJson !== undefined) fs.writeFileSync(path.join(dir, 'case.json'), caseJson)
    return dir
  }

  it('accepts an id equal to the folder name and a non-empty name', () => {
    const dir = caseFolder('ATM-TOKEN-06', '{"id": "ATM-TOKEN-06", "name": "tokens"}\n')
    expect(caseIndexProblems('ATM-TOKEN-06', readCaseIndex(dir))).toEqual([])
  })

  it('ignores extra fields a suite index carries, such as Neo sync', () => {
    const json = '{"id": "NEO-TYPE-09", "name": "strict colours", "sync": true}\n'
    const dir = caseFolder('NEO-TYPE-09', json)
    expect(caseIndexProblems('NEO-TYPE-09', readCaseIndex(dir))).toEqual([])
  })

  it('reports a missing case.json with the line to add', () => {
    const dir = caseFolder('TST-AUD-01')
    expect(caseIndexProblems('TST-AUD-01', readCaseIndex(dir))).toEqual([
      'no case.json; add {"id": "TST-AUD-01", "name": "<one-line claim>"}',
    ])
  })

  it('reports invalid JSON', () => {
    const dir = caseFolder('TST-AUD-01', '{"id": "TST-AUD-01",')
    const problems = caseIndexProblems('TST-AUD-01', readCaseIndex(dir))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^case\.json is not valid JSON \(/)
  })

  it('reports an id that differs from the folder name', () => {
    const dir = caseFolder('TST-AUD-01', '{"id": "TST-AUD-02", "name": "x"}\n')
    expect(caseIndexProblems('TST-AUD-01', readCaseIndex(dir))).toEqual([
      'case.json id is "TST-AUD-02"; it must equal folder name "TST-AUD-01"',
    ])
  })

  it('reports a missing id and a missing or blank name', () => {
    const dir = caseFolder('TST-AUD-01', '{"name": "  "}\n')
    expect(caseIndexProblems('TST-AUD-01', readCaseIndex(dir))).toEqual([
      'case.json id is missing; it must equal folder name "TST-AUD-01"',
      'case.json needs a non-empty string "name"',
    ])
  })

  it('rejects a document that is not a JSON object', () => {
    const dir = caseFolder('TST-AUD-01', '["TST-AUD-01"]\n')
    expect(caseIndexProblems('TST-AUD-01', readCaseIndex(dir))).toEqual([
      'case.json must be a JSON object',
    ])
  })
})

describe('case folder names', () => {
  it('flags folders whose names are not raw case IDs and keeps the rest', () => {
    const names = ['ATM-TOKEN-06', 'stray-folder', 'ATM-TOKEN-6', 'ATM-SITE-01']
    expect(strayCaseFolders(names, ATOMIC_CASE)).toEqual(['stray-folder', 'ATM-TOKEN-6'])
  })
})

describe('case README heading', () => {
  const headingHint = 'README.md first line must be "# ATM-TOKEN-06 — <one-line claim>"'

  it('accepts a first line of "# <folder> — <claim>"', () => {
    const readme = '# ATM-TOKEN-06 — tokens resolve\n\nbody\n'
    expect(readmeProblems('ATM-TOKEN-06', readme)).toEqual([])
  })

  it('accepts CRLF line endings', () => {
    const readme = '# ATM-TOKEN-06 — tokens\r\nbody\r\n'
    expect(readmeProblems('ATM-TOKEN-06', readme)).toEqual([])
  })

  it('rejects a bare heading, a colon title, and prose as the first line', () => {
    expect(readmeProblems('ATM-TOKEN-06', '# ATM-TOKEN-06\n')).toEqual([headingHint])
    expect(readmeProblems('ATM-TOKEN-06', '# ATM-TOKEN-06: tokens\n')).toEqual([
      headingHint,
    ])
    expect(readmeProblems('ATM-TOKEN-06', 'Harness probe: prose\n')).toEqual([
      headingHint,
    ])
  })

  it('reports a heading that names another ID or has an empty claim', () => {
    expect(readmeProblems('ATM-TOKEN-06', '# ATM-TOKEN-07 — tokens\n')).toEqual([
      'README.md heading names "ATM-TOKEN-07"; it must name folder "ATM-TOKEN-06"',
    ])
    expect(readmeProblems('ATM-TOKEN-06', '# ATM-TOKEN-06 — \n')).toEqual([
      'README.md heading has no claim after the em dash',
    ])
  })

  it('reports a missing README with the heading to add', () => {
    expect(readmeProblems('ATM-TOKEN-06', null)).toEqual([
      'no README.md; its first line must be "# ATM-TOKEN-06 — <one-line claim>"',
    ])
  })
})
