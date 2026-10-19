/*
 * The injected Playwright summary reporter counts each test once by its
 * outcome: an expected failure (`test.fail` that fails) is never "failed",
 * a marked test that passes is, and retries, skips and flakes count apart.
 * The reporter source is evaluated as the container loads it (CommonJS).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { playwrightSummaryReporterCode } from './playwright-reporter.js'

type Outcome = 'expected' | 'unexpected' | 'flaky' | 'skipped'

interface FakeResult {
  status: string
  errors: Array<{ message: string }>
}

interface Reporter {
  onTestEnd(test: unknown, result: FakeResult): void
  onEnd(): void
}

function loadReporter(): new () => Reporter {
  const loaded = { exports: undefined as unknown }
  new Function('module', playwrightSummaryReporterCode)(loaded)
  return loaded.exports as new () => Reporter
}

function fakeTest(id: string, expectedStatus: string, outcome: Outcome) {
  return { id, title: id, expectedStatus, titlePath: () => ['', 'suite', id], outcome: () => outcome }
}

/** Run the reporter over `(test, result)` pairs and return the printed lines without ANSI codes. */
function report(events: Array<[ReturnType<typeof fakeTest>, FakeResult]>): string[] {
  const Reporter = loadReporter()
  const reporter = new Reporter()
  const lines: string[] = []
  const log = console.log
  console.log = (line: string) => lines.push(String(line).replace(/\x1b\[[0-9;]*m/g, ''))
  try {
    for (const [test, result] of events) reporter.onTestEnd(test, result)
    reporter.onEnd()
  } finally {
    console.log = log
  }
  return lines
}

const passed: FakeResult = { status: 'passed', errors: [] }
const failed: FakeResult = { status: 'failed', errors: [{ message: 'expect(received).toBe(expected)' }] }

describe('playwright summary reporter', () => {
  it('counts expected failures apart and never as failed', () => {
    const lines = report([
      [fakeTest('a', 'passed', 'expected'), passed],
      [fakeTest('b', 'failed', 'expected'), failed],
      [fakeTest('c', 'failed', 'expected'), failed],
    ])
    const summary = lines.find(line => line.includes('Playwright')) ?? ''
    assert.match(summary, /1 passed \| 2 expected to fail \(3\)/)
    assert.doesNotMatch(summary, /failed/)
    assert.equal(lines.includes('  Failed tests:'), false)
  })

  it('fails a marked test that passes, naming why', () => {
    const lines = report([[fakeTest('stale', 'failed', 'unexpected'), passed]])
    assert.match(lines.find(line => line.includes('Playwright')) ?? '', /0 passed \| 1 failed \(1\)/)
    assert.ok(lines.some(line => line.includes('suite › stale')))
    assert.ok(lines.some(line => line.includes('expected to fail, but passed')))
  })

  it('counts a retried test once by its last attempt, and skips and flakes apart', () => {
    const flaky = fakeTest('retried', 'passed', 'flaky')
    const lines = report([
      [flaky, failed],
      [flaky, passed],
      [fakeTest('skip', 'skipped', 'skipped'), { status: 'skipped', errors: [] }],
      [fakeTest('broken', 'passed', 'unexpected'), failed],
    ])
    assert.match(
      lines.find(line => line.includes('Playwright')) ?? '',
      /0 passed \| 1 flaky \| 1 skipped \| 1 failed \(3\)/
    )
    assert.ok(lines.some(line => line.includes('expect(received).toBe(expected)')))
  })
})
