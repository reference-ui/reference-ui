// Unit tests for the stat-poll backstop over a temp dir with fake timers. They pin that an
// edit, a deletion, and a new entry in a polled directory each drift on the next tick, that a
// quiet tick and a path the scope newly names stay silent, that a drift waits out its grace and
// a pass settles it, and that stop() ends the polling.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startPollBackstop } from './poll.ts'

const TICK = 100
const NOW = { intervalMs: TICK, graceMs: 0 }

let dir: string
let file: string

beforeEach(() => {
  vi.useFakeTimers()
  dir = mkdtempSync(join(tmpdir(), 'ref-watch-poll-'))
  mkdirSync(join(dir, 'src'))
  file = join(dir, 'src', 'a.tsx')
  writeFileSync(file, 'a')
})

afterEach(() => {
  vi.useRealTimers()
  rmSync(dir, { recursive: true, force: true })
})

describe('startPollBackstop', () => {
  it('drifts once on the tick after an edit, and stays quiet after', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, NOW)
    vi.advanceTimersByTime(TICK)
    expect(onStale).not.toHaveBeenCalled()
    writeFileSync(file, 'a longer body')
    vi.advanceTimersByTime(TICK)
    expect(onStale).toHaveBeenCalledTimes(1)
    expect([...onDrift.mock.calls[0][0].keys()]).toEqual([file])
    vi.advanceTimersByTime(TICK * 3)
    expect(onStale).toHaveBeenCalledTimes(1)
    poll.stop()
  })

  it('drifts when a polled file is deleted', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, NOW)
    rmSync(file)
    vi.advanceTimersByTime(TICK)
    expect(onStale).toHaveBeenCalledTimes(1)
    poll.stop()
  })

  it('drifts when a polled directory gains an entry', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const src = join(dir, 'src')
    const poll = startPollBackstop(() => [src], { onDrift, onStale }, NOW)
    // A directory mtime can tie with the setup write on a coarse clock, so move it explicitly.
    writeFileSync(join(src, 'b.tsx'), 'b')
    const later = new Date(Date.now() + 5000)
    vi.setSystemTime(later)
    writeFileSync(join(src, 'c.tsx'), 'c')
    vi.advanceTimersByTime(TICK)
    expect(onStale).toHaveBeenCalledTimes(1)
    poll.stop()
  })

  it('records a path the scope newly names without drifting', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const extra = join(dir, 'src', 'extra.tsx')
    writeFileSync(extra, 'x')
    const targets = [file]
    const poll = startPollBackstop(() => targets, { onDrift, onStale }, NOW)
    targets.push(extra)
    vi.advanceTimersByTime(TICK * 2)
    expect(onStale).not.toHaveBeenCalled()
    poll.stop()
  })

})

describe('startPollBackstop grace and settle', () => {
  it('holds a drift for its grace, then reports it once', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, { intervalMs: TICK, graceMs: TICK * 3 })
    writeFileSync(file, 'a longer body')
    vi.advanceTimersByTime(TICK * 3)
    expect(onStale).not.toHaveBeenCalled()
    vi.advanceTimersByTime(TICK)
    expect(onStale).toHaveBeenCalledTimes(1)
    poll.stop()
  })

  it('drops a drift a pass settled before its grace ran out', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, { intervalMs: TICK, graceMs: TICK * 3 })
    writeFileSync(file, 'a longer body')
    vi.advanceTimersByTime(TICK)
    poll.settled()
    vi.advanceTimersByTime(TICK * 5)
    expect(onStale).not.toHaveBeenCalled()
    poll.stop()
  })

  it('reports a write older than the latest pass, but leaves its resync to that pass', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, NOW)
    writeFileSync(file, 'a longer body')
    vi.setSystemTime(new Date(Date.now() + 5000))
    poll.settled()
    vi.advanceTimersByTime(TICK * 2)
    expect(onDrift).toHaveBeenCalledTimes(1)
    expect(onStale).not.toHaveBeenCalled()
    poll.stop()
  })

})

describe('startPollBackstop stop', () => {
  it('never schedules for a drift the sink reports as no change', () => {
    const onStale = vi.fn()
    const poll = startPollBackstop(() => [file], { onDrift: () => new Map(), onStale }, NOW)
    writeFileSync(file, 'a longer body')
    vi.advanceTimersByTime(TICK * 3)
    expect(onStale).not.toHaveBeenCalled()
    poll.stop()
  })

  it('stops polling on stop()', () => {
    const onStale = vi.fn()
    const onDrift = vi.fn((drifted: Map<string, string>) => drifted)
    const poll = startPollBackstop(() => [file], { onDrift, onStale }, NOW)
    poll.stop()
    writeFileSync(file, 'changed after stop')
    vi.advanceTimersByTime(TICK * 3)
    expect(onStale).not.toHaveBeenCalled()
  })
})
