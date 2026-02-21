import Piscina from 'piscina'
import { cpus } from 'os'
import { WORKERS, type WorkerName } from './workers'

let pool: Piscina | undefined

function getPool() {
  if (pool) return pool

  pool = new Piscina({
    minThreads: 2,
    maxThreads: Math.max(4, cpus().length - 1),
    idleTimeout: 30000,
  })

  pool.on('error', err => console.error('[pool]', err))
  return pool
}

export async function runWorker(worker: WorkerName | string, payload: any) {
  const workerPath =
    typeof worker === 'string' && worker in WORKERS
      ? WORKERS[worker as WorkerName]
      : worker

  return getPool().run(payload, { filename: workerPath })
}

export async function shutdown() {
  if (pool) {
    await pool.destroy()
    pool = undefined
  }
}
