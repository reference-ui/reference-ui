/**
 * Bound component verification to one active job and two workers per job.
 * Environment overrides may lower the worker budget without raising its ceiling.
 * It also resolves the checkout a daemon job runs in (its caller's tree, never the
 * daemon's), decides when the shared gallery serves a job, and words the client's
 * refusal when a daemon confirms a different tree. Fs access is injected.
 */
export const MAX_ACTIVE_JOBS = 1
export const MAX_WORKERS = 2

export function workerBudget(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_WORKERS) : MAX_WORKERS
}

export function canAcquireJob(queueIndex, activeCount) {
  return queueIndex === 0 && activeCount < MAX_ACTIVE_JOBS
}

// Pure ownership selection over a pid->{pid,ppid,pgid} inventory. Builds the
// complete root+descendant pid set first, then keeps a process-group id only
// when its leader (pid === pgid) is itself inside that set and its inventory
// row identifies it as that leader. A descendant that merely inherits an
// ancestor group, or a group whose leader lives outside the tree, is excluded
// so callers can never signal the daemon/supervisor/terminal group by accident.
export function selectOwnedGroups(inventory, rootPid, { includeRootGroup = true } = {}) {
  const groups = new Set()
  if (!inventory || !Number.isInteger(rootPid) || rootPid <= 0) return groups

  const childrenByParent = new Map()
  for (const entry of inventory.values()) {
    const siblings = childrenByParent.get(entry.ppid) || []
    siblings.push(entry.pid)
    childrenByParent.set(entry.ppid, siblings)
  }

  const members = new Set()
  const stack = [rootPid]
  while (stack.length) {
    const pid = stack.pop()
    if (members.has(pid)) continue
    members.add(pid)
    for (const childPid of childrenByParent.get(pid) || []) stack.push(childPid)
  }

  for (const pid of members) {
    const entry = inventory.get(pid)
    if (!entry || !Number.isInteger(entry.pgid) || entry.pgid <= 0) continue
    const leaderPid = entry.pgid
    if (!members.has(leaderPid)) continue
    const leader = inventory.get(leaderPid)
    if (!leader || leader.pid !== leader.pgid) continue
    groups.add(leaderPid)
  }

  if (!includeRootGroup) {
    const rootEntry = inventory.get(rootPid)
    if (rootEntry && Number.isInteger(rootEntry.pgid) && rootEntry.pgid > 0) {
      groups.delete(rootEntry.pgid)
    }
  }

  return groups
}

// Fail-closed listener ownership. True only for a nonempty inspected listener
// set, an available inventory, and every listener pid present in an explicitly
// owned group. Empty, unavailable, partial, unknown, and mixed sets are false,
// so a missing inventory can never be mistaken for the spawned Vite.
export function isListenerOwnedByGroups(listenerPids, inventory, groups) {
  if (!Array.isArray(listenerPids) || listenerPids.length === 0) return false
  if (!inventory || !groups || groups.size === 0) return false
  for (const pid of listenerPids) {
    const entry = inventory.get(pid)
    if (!entry) return false
    if (!groups.has(entry.pgid)) return false
  }
  return true
}

const RUNNER_PATH = '.agents/skills/test-component/scripts/test-component.mjs'

// Strict root finder: unlike findRepoRoot it never falls back to process.cwd(),
// which inside the daemon is the daemon's own tree.
export function findWorkspaceRoot(startDir, exists) {
  if (!startDir) return null
  let cur = startDir.replace(/\/+$/, '') || '/'
  for (;;) {
    if (exists(`${cur}/pnpm-workspace.yaml`)) return cur
    const parent = cur.slice(0, cur.lastIndexOf('/')) || '/'
    if (parent === cur) return null
    cur = parent
  }
}

// The tree a job runs in: the root the client sent, else the workspace above its cwd.
export function resolveJobTree(req, { findRoot, exists, realpath }) {
  let root = null
  if (req?.root) {
    try {
      root = realpath(req.root)
    } catch {
      throw new Error(`agentct job root ${req.root} does not exist`)
    }
  } else {
    root = req?.cwd ? findRoot(req.cwd) : null
    if (!root) throw new Error(`agentct found no workspace root above ${req?.cwd || '(no cwd sent)'}`)
  }
  const runner = `${root}/${RUNNER_PATH}`
  if (!exists(runner)) throw new Error(`agentct runner missing in job tree: ${runner}`)
  return { root, runner, libDir: `${root}/packages/reference-lib` }
}

export function galleryServes(gallery, { root, runtime }) {
  if (!gallery || !gallery.root || !gallery.runtime) return false
  return gallery.root === root && gallery.runtime === runtime
}

// Client-side check of the daemon's start ack. Null when the job runs here.
export function jobTreeProblem(clientRoot, ackRoot, pid) {
  if (ackRoot && ackRoot === clientRoot) return null
  const daemonTree = ackRoot ? `runs this job in ${ackRoot}` : 'is an older daemon that runs its own checkout'
  return [
    `[agentct] Refused: this tree is ${clientRoot}, but the live daemon ${daemonTree}.`,
    '[agentct] Nothing ran.',
    `[agentct] Fix: wait for the daemon's 5-minute idle stop, or run \`pnpm agentct stop\` once \`ps -o command= -p ${pid}\` shows no agent needs it.`,
  ].join('\n')
}
