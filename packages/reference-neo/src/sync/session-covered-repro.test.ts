// Repro suite for the handshake between a one-shot and a resident watch, and for
// the signal timing of a held lock: real `ref` child processes over temp worlds,
// never the workspace. It takes a gated watch resync and asserts that a one-shot
// poking it exits only once the output is current, that a failed covering resync
// fails the one-shot, and that a kill landing the instant an owner document is
// visible still exits the victim 75. The in-process wait is proven against a
// stand-in watch in session-covered.test.ts; the watch driver in lib/watch.

import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BOOT_BLOCK_RE,
  POSIX,
  REBRAND,
  childDone,
  cleanupHarness,
  holdWatchMidResync,
  runBin,
  sheetHasBrand,
  sleep,
  spawnBin,
  waitForExit,
  waitForOutput,
  writeWorld,
} from './__fixtures__/session-repro-harness.ts'

afterEach(cleanupHarness)

describe.skipIf(!POSIX)('sync session lock: the one-shot waits on a resident watch', () => {
  it('a one-shot that pokes a watch mid-resync exits 0 only after the resync that covers it, with the output current', async () => {
    const held = await holdWatchMidResync()
    const newcomer = spawnBin(['sync', held.dir], held.dir)
    // The resync in flight started before the poke, so it cannot answer it: the
    // newcomer must still be waiting after it has had every chance to give up.
    await sleep(2500)
    expect(childDone(newcomer.child), `the newcomer left before the watch resynced:\n${newcomer.output()}`).toBe(false)
    expect(newcomer.output()).not.toMatch(BOOT_BLOCK_RE)
    held.openGate()
    await waitForExit(newcomer, 'the newcomer')
    expect(newcomer.child.exitCode, newcomer.output()).toBe(0)
    expect(newcomer.output()).toContain(`already watching this project (pid ${held.watch.child.pid})`)
    expect(newcomer.output()).not.toMatch(BOOT_BLOCK_RE)
    expect(sheetHasBrand(held.dir, REBRAND)).toBe(true)
    held.watch.child.kill('SIGTERM')
    await waitForExit(held.watch, 'the watch')
    expect(held.watch.child.exitCode).toBe(0)
  }, 120000)

  it('a one-shot whose covering resync fails exits 1 naming the watch, then exits 0 once the fix lands', async () => {
    const dir = await writeWorld(0)
    const watch = spawnBin(['sync', '--watch', dir], dir)
    await waitForOutput(watch, () => watch.output().includes('ready in'), 'the boot block')
    const broken = join(dir, 'theme', 'bad.ts')
    writeFileSync(broken, "import { css } from '@reference-ui/react'\n\nexport const cls = css({ color: '{colors.nope}' })\n")
    await waitForOutput(watch, () => /watch error/.test(watch.output()), 'the watch to report the failed resync')
    const failed = await runBin(['sync', dir], dir)
    expect(failed.code, failed.stdout + failed.stderr).toBe(1)
    expect(failed.stdout + failed.stderr).toContain("the resident watch's sync failed")
    rmSync(broken, { force: true })
    const fixed = await runBin(['sync', dir], dir)
    expect(fixed.code, fixed.stdout + fixed.stderr).toBe(0)
    expect(fixed.stdout).toContain(`already watching this project (pid ${watch.child.pid})`)
    watch.child.kill('SIGTERM')
    await waitForExit(watch, 'the watch')
  }, 120000)
})

describe.skipIf(!POSIX)('sync session lock: handlers are on before the owner is visible', () => {
  it('a SIGTERM with a preempt marker, sent the instant the owner document appears, exits the victim 75 every time', async () => {
    const dir = await writeWorld(0)
    const lockDir = join(dir, '.reference-ui', 'sync.lock')
    for (let round = 0; round < 6; round += 1) {
      const victim = spawnBin(['sync', dir], dir)
      while (!existsSync(join(lockDir, 'owner.json'))) {
        if (childDone(victim.child)) throw new Error(`the victim exited before it held the lock:\n${victim.output()}`)
        await new Promise((resolve) => setImmediate(resolve))
      }
      writeFileSync(join(lockDir, 'preempt.json'), JSON.stringify({ pid: process.pid, kind: 'one-shot' }))
      victim.child.kill('SIGTERM')
      await waitForExit(victim, 'the victim')
      expect(victim.child.signalCode, `round ${round}: the victim died by signal:\n${victim.output()}`).toBeNull()
      expect(victim.child.exitCode, `round ${round}:\n${victim.output()}`).toBe(75)
      expect(victim.output()).toContain(`superseded by sync pid ${process.pid}`)
    }
  }, 120000)
})
