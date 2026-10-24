// Node test for the stale build folder rule in stale-build.mjs.
// It runs under `node --test` and covers a dead pid, a live pid with a fresh folder, a live pid
// with an old folder (a reused pid), and the calling process's own folder.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isStaleBuildFolder } from './stale-build.mjs'

const NOW = 1_000_000_000
const MINUTE = 60 * 1000
const OWN_PID = 4242

function check(overrides) {
  return isStaleBuildFolder({
    name: '.dist-new-777',
    pidAlive: true,
    mtimeMs: NOW - MINUTE,
    nowMs: NOW,
    ownPid: OWN_PID,
    ...overrides,
  })
}

test('a folder whose pid is not running is stale', () => {
  assert.equal(check({ pidAlive: false }), true)
})

test('a live pid with a fresh folder is a build in progress', () => {
  assert.equal(check({ pidAlive: true, mtimeMs: NOW - MINUTE }), false)
})

test('a live pid with a folder older than ten minutes is a reused pid', () => {
  assert.equal(check({ pidAlive: true, mtimeMs: NOW - 11 * MINUTE }), true)
})

test('our own folder is never stale', () => {
  assert.equal(
    check({ name: `.dist-new-${OWN_PID}`, pidAlive: false, mtimeMs: NOW - 60 * MINUTE }),
    false
  )
})
