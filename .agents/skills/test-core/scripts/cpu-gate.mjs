import fs from 'node:fs'
import path from 'node:path'

const GATE_DIR = '/tmp/reference-ui-cpu-gate'
const LOCK_FILE = path.join(GATE_DIR, 'locks.json')
const MUTEX_DIR = path.join(GATE_DIR, '.mutex')

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number' || isNaN(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function withFileMutex(action) {
  const startTime = Date.now()
  let acquired = false
  try { fs.mkdirSync(GATE_DIR, { recursive: true }) } catch {}
  
  while (!acquired && Date.now() - startTime < 5000) {
    try {
      fs.mkdirSync(MUTEX_DIR)
      acquired = true
    } catch {
      try {
        const stat = fs.statSync(MUTEX_DIR)
        if (Date.now() - stat.mtimeMs > 5000) {
          fs.rmdirSync(MUTEX_DIR)
        }
      } catch {}
      const end = Date.now() + 20
      while (Date.now() < end) {}
    }
  }
  try {
    return action()
  } finally {
    if (acquired) {
      try { fs.rmdirSync(MUTEX_DIR) } catch {}
    }
  }
}

export function readLocks() {
  if (!fs.existsSync(LOCK_FILE)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
    const parsed = Array.isArray(raw) ? raw : []
    const alive = parsed.filter(l => isPidAlive(l.pid))
    if (alive.length !== parsed.length) {
      writeLocks(alive)
    }
    return alive
  } catch {
    return []
  }
}

function writeLocks(locks) {
  try {
    if (locks.length === 0) {
      if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE)
    } else {
      fs.writeFileSync(LOCK_FILE, JSON.stringify(locks, null, 2))
    }
  } catch {}
}

export async function acquireCpuGate(holderClass, taskName = '') {
  const myPid = process.pid
  
  if (process.env.REFERENCE_UI_CPU_GATE_HELD && process.env.REFERENCE_UI_CPU_GATE_HELD.startsWith('exclusive:')) {
    return async () => {}
  }
  
  let loggedWait = false
  let lastLogTime = 0
  
  while (true) {
    let acquired = false
    
    withFileMutex(() => {
      const locks = readLocks()
      
      if (holderClass === 'exclusive') {
        const hasCt = locks.some(l => l.class === 'ct')
        const hasRs = locks.some(l => l.class === 'rs')
        const hasRsBuild = locks.some(l => l.class === 'rs:build')
        const hasExclusive = locks.some(l => l.class === 'exclusive' && l.pid !== myPid)
        
        if (!hasCt && !hasRs && !hasRsBuild && !hasExclusive) {
          if (!locks.find(l => l.pid === myPid)) {
            locks.push({ pid: myPid, class: 'exclusive', name: taskName })
            writeLocks(locks)
          }
          acquired = true
        }
      } else if (holderClass === 'ct') {
        const hasExclusive = locks.some(l => l.class === 'exclusive')
        if (!hasExclusive) {
          if (!locks.find(l => l.pid === myPid)) {
            locks.push({ pid: myPid, class: 'ct', name: taskName })
            writeLocks(locks)
          }
          acquired = true
        }
      } else if (holderClass === 'rs:build') {
        const hasExclusive = locks.some(l => l.class === 'exclusive')
        const hasRsBuild = locks.some(l => l.class === 'rs:build' && l.pid !== myPid)
        if (!hasExclusive && !hasRsBuild) {
          if (!locks.find(l => l.pid === myPid)) {
            locks.push({ pid: myPid, class: 'rs:build', name: taskName })
            writeLocks(locks)
          }
          acquired = true
        }
      } else if (holderClass === 'rs') {
        const hasExclusive = locks.some(l => l.class === 'exclusive')
        const hasRsBuild = locks.some(l => l.class === 'rs:build')
        const activeRs = locks.filter(l => l.class === 'rs' && l.pid !== myPid)
        if (!hasExclusive && !hasRsBuild && activeRs.length < 2) {
          if (!locks.find(l => l.pid === myPid)) {
            locks.push({ pid: myPid, class: 'rs', name: taskName })
            writeLocks(locks)
          }
          acquired = true
        }
      }
    })
    
    if (acquired) {
      if (loggedWait) {
        console.log(`[cpu-gate] Gate acquired for ${holderClass} (PID ${myPid})`)
      }
      
      const release = () => {
        withFileMutex(() => {
          const locks = readLocks()
          const remaining = locks.filter(l => l.pid !== myPid)
          writeLocks(remaining)
        })
      }
      
      process.on('exit', release)
      process.on('SIGINT', release)
      process.on('SIGTERM', release)
      
      return async () => {
        process.off('exit', release)
        process.off('SIGINT', release)
        process.off('SIGTERM', release)
        release()
      }
    }
    
    const now = Date.now()
    if (!loggedWait || now - lastLogTime > 10000) {
      let activeStr = ''
      withFileMutex(() => {
         const locks = readLocks()
         activeStr = locks.map(l => `${l.class}(${l.pid})`).join(', ')
      })
      console.log(`[cpu-gate] Waiting for cpu gate (${holderClass}). Active: ${activeStr || 'none'}`)
      loggedWait = true
      lastLogTime = now
    }
    
    await new Promise(r => setTimeout(r, 1000))
  }
}

export async function withCpuGate(holderClass, taskName, fn) {
  const release = await acquireCpuGate(holderClass, taskName)
  const prevEnv = process.env.REFERENCE_UI_CPU_GATE_HELD
  const isExclusiveType = holderClass === 'exclusive' || holderClass === 'rs:build'
  if (isExclusiveType) {
    process.env.REFERENCE_UI_CPU_GATE_HELD = `${holderClass}:${process.pid}`
  }
  try {
    return await fn()
  } finally {
    if (isExclusiveType) {
      if (prevEnv) process.env.REFERENCE_UI_CPU_GATE_HELD = prevEnv
      else delete process.env.REFERENCE_UI_CPU_GATE_HELD
    }
    await release()
  }
}
