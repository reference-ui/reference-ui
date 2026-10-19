// node:test suite for the agentct job-slot and worker-budget rules.
// It takes synthetic process inventories and asserts slot acquisition, worker budgets, and
// owned-listener detection without touching real processes.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canAcquireJob,
  isListenerOwnedByGroups,
  MAX_ACTIVE_JOBS,
  MAX_WORKERS,
  selectOwnedGroups,
  workerBudget,
} from './resources.mjs'

function inventoryOf(rows) {
  const map = new Map()
  for (const [pid, ppid, pgid] of rows) map.set(pid, { pid, ppid, pgid })
  return map
}

test('worker overrides can reduce the budget but cannot expand it', () => {
  assert.equal(MAX_ACTIVE_JOBS, 1)
  assert.equal(MAX_WORKERS, 2)
  for (const value of [1, '1', ' 1 ']) assert.equal(workerBudget(value), 1)
  for (const value of [2, '2', 100, '100']) assert.equal(workerBudget(value), 2)
})

test('invalid worker counts default safely without fractional or empty pools', () => {
  for (const value of [undefined, null, '', ' ', 0, -1, '0', '-1', 1.5, '1.5', '2bad', 'NaN', 'Infinity', NaN, Infinity]) {
    assert.equal(workerBudget(value), 2, String(value))
  }
})

test('only the queue head can start and legacy active slots block it', () => {
  assert.equal(canAcquireJob(0, 0), true)
  for (const active of [1, 2, 3]) assert.equal(canAcquireJob(0, active), false)
  for (const position of [-1, 1, 2, 3]) assert.equal(canAcquireJob(position, 0), false)
})

test('collectOwnedGroups excludes ancestor and unrelated groups, keeps detached descendants', () => {
  // Supervisor (pid 50) leads group 50 as an ancestor. Root 100 and children
  // 101/102/103 inherit group 50; 103 sits in unrelated group 300 whose leader
  // lives outside the tree. Descendant 200 is its own detached group leader.
  const inventory = inventoryOf([
    [50, 1, 50],
    [100, 50, 50],
    [101, 100, 50],
    [102, 100, 50],
    [103, 100, 300],
    [200, 101, 200],
    [300, 1, 300],
  ])
  assert.deepEqual([...selectOwnedGroups(inventory, 100)].sort((a, b) => a - b), [200])
})

test('root as its own detached group leader is included unless excludeRootGroup', () => {
  const inventory = inventoryOf([
    [100, 1, 100],
    [101, 100, 100],
    [200, 100, 200],
  ])
  assert.deepEqual([...selectOwnedGroups(inventory, 100)].sort((a, b) => a - b), [100, 200])
  assert.deepEqual(
    [...selectOwnedGroups(inventory, 100, { includeRootGroup: false })].sort((a, b) => a - b),
    [200],
  )
})

test('collectOwnedGroups is empty without a usable inventory or root', () => {
  const inventory = inventoryOf([[100, 1, 100]])
  assert.deepEqual([...selectOwnedGroups(null, 100)], [])
  assert.deepEqual([...selectOwnedGroups(inventory, 0)], [])
  assert.deepEqual([...selectOwnedGroups(inventory, -5)], [])
  assert.deepEqual([...selectOwnedGroups(inventory, 999)], [])
})

test('listener ownership fails closed on empty, unknown, partial, and mixed sets', () => {
  // 100 is an owned group leader; 101 listens in unrelated group 200.
  const inventory = inventoryOf([
    [100, 1, 100],
    [101, 100, 200],
  ])
  const owned = new Set([100])

  assert.equal(isListenerOwnedByGroups([100], inventory, owned), true)
  assert.equal(isListenerOwnedByGroups([101], inventory, new Set([200])), true)
  assert.equal(isListenerOwnedByGroups([], inventory, owned), false)
  assert.equal(isListenerOwnedByGroups([100], null, owned), false)
  assert.equal(isListenerOwnedByGroups([100], inventory, new Set()), false)
  assert.equal(isListenerOwnedByGroups([100], inventory, new Set([200])), false)
  assert.equal(isListenerOwnedByGroups([999], inventory, owned), false)
  assert.equal(isListenerOwnedByGroups([101], inventory, owned), false)
  assert.equal(isListenerOwnedByGroups([100, 101], inventory, owned), false)
})
