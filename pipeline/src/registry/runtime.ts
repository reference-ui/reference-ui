/**
 * Managed Verdaccio lifecycle for the pipeline-local registry.
 *
 * This module owns the process-level concerns: starting Verdaccio, stopping it,
 * cleaning state, and guarding against accidentally colliding with a user-run
 * registry on the same port.
 */

import { execFileSync, spawn } from 'node:child_process'
import { openSync } from 'node:fs'
import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { managedRegistryHost, managedRegistryPort } from '../../config.js'
import { repoRoot } from '../build/workspace.js'
import {
  defaultRegistryUrl,
  registryStateDir,
  verdaccioConfigPath,
  verdaccioLogPath,
  verdaccioPidPath,
  verdaccioStorageDir,
  verdaccioStoreDir,
} from './paths.js'

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds)
  })
}

async function isRegistryAvailable(registryUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${registryUrl}/-/ping`, {
      signal: AbortSignal.timeout(1_000),
    })

    return response.ok
  } catch {
    return false
  }
}

async function waitForRegistry(registryUrl: string, timeoutMs: number = 15_000): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isRegistryAvailable(registryUrl)) {
      return
    }

    await sleep(250)
  }

  throw new Error(`Timed out waiting for local registry at ${registryUrl}`)
}

async function readManagedRegistryPid(): Promise<number | null> {
  try {
    const contents = await readFile(verdaccioPidPath, 'utf8')
    const pid = Number.parseInt(contents.trim(), 10)
    return Number.isFinite(pid) ? pid : null
  } catch {
    return null
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function parseListeningProcessPid(lsofOutput: string): number | null {
  const lines = lsofOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return null
  }

  const columns = lines[1]?.split(/\s+/)
  const pid = Number.parseInt(columns?.[1] ?? '', 10)

  return Number.isFinite(pid) ? pid : null
}

export function isAdoptableRegistryProcessCommand(command: string): boolean {
  return /(^|\s|\/)verdaccio(\s|$)/i.test(command.trim())
}

function readListeningProcessPid(port: number): number | null {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return parseListeningProcessPid(output)
  } catch {
    return null
  }
}

function readProcessCommand(pid: number): string {
  try {
    return execFileSync('ps', ['-p', `${pid}`, '-o', 'command='], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

async function adoptExistingVerdaccioProcessIfPossible(): Promise<number | null> {
  const listeningPid = readListeningProcessPid(managedRegistryPort)

  if (!listeningPid || !isProcessRunning(listeningPid)) {
    return null
  }

  const command = readProcessCommand(listeningPid)

  if (!isAdoptableRegistryProcessCommand(command)) {
    return null
  }

  await mkdir(registryStateDir, { recursive: true })
  await writeFile(verdaccioPidPath, `${listeningPid}\n`)

  return listeningPid
}

async function resolveManagedRegistryPid(registryAlreadyRunning: boolean): Promise<number | null> {
  const managedPid = await readManagedRegistryPid()
  const managedRegistryRunning = managedPid !== null && isProcessRunning(managedPid)

  if (managedPid !== null && !managedRegistryRunning) {
    await removeManagedRegistryPidFile()
  }

  if (!registryAlreadyRunning) {
    return managedRegistryRunning ? managedPid : null
  }

  if (managedRegistryRunning) {
    return managedPid
  }

  return adoptExistingVerdaccioProcessIfPossible()
}

async function removeManagedRegistryPidFile(): Promise<void> {
  try {
    await unlink(verdaccioPidPath)
  } catch {
    // Ignore missing pid files.
  }
}

export async function stopManagedLocalRegistry(): Promise<void> {
  const pid = await readManagedRegistryPid()

  if (!pid) {
    return
  }

  if (!isProcessRunning(pid)) {
    await removeManagedRegistryPidFile()
    return
  }

  process.kill(pid, 'SIGTERM')

  const startedAt = Date.now()
  while (Date.now() - startedAt < 5_000) {
    if (!isProcessRunning(pid)) {
      await removeManagedRegistryPidFile()
      return
    }

    await sleep(100)
  }

  process.kill(pid, 'SIGKILL')
  await removeManagedRegistryPidFile()
}

async function startManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  await mkdir(registryStateDir, { recursive: true })
  const listenAddress = `${managedRegistryHost}:${managedRegistryPort}`

  const logFd = openSync(verdaccioLogPath, 'a')
  const child = spawn(
    'pnpm',
    [
      'exec',
      'verdaccio',
      '--config',
      verdaccioConfigPath,
      '--listen',
      listenAddress,
    ],
    {
      cwd: resolve(repoRoot, 'pipeline'),
      detached: true,
      stdio: ['ignore', logFd, logFd],
    },
  )

  child.unref()

  if (!child.pid) {
    throw new Error('Failed to start the managed local registry process.')
  }

  await writeFile(verdaccioPidPath, `${child.pid}\n`)
  await waitForRegistry(registryUrl)
}

export async function ensureManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  if (registryUrl !== defaultRegistryUrl) {
    throw new Error(`Managed registry startup only supports ${defaultRegistryUrl} right now.`)
  }

  const registryAlreadyRunning = await isRegistryAvailable(registryUrl)
  const managedPid = await resolveManagedRegistryPid(registryAlreadyRunning)
  const managedRegistryRunning = managedPid !== null && isProcessRunning(managedPid)

  if (registryAlreadyRunning && !managedRegistryRunning) {
    throw new Error(
      `A registry is already running at ${registryUrl}, but it is not managed by the pipeline. Stop that process or use the lower-level registry commands manually.`,
    )
  }

  if (registryAlreadyRunning || managedRegistryRunning) {
    return
  }

  await startManagedLocalRegistry(registryUrl)
}

export async function rebuildManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  if (registryUrl !== defaultRegistryUrl) {
    throw new Error(`Managed registry rebuild only supports ${defaultRegistryUrl} right now.`)
  }

  const registryAlreadyRunning = await isRegistryAvailable(registryUrl)
  const managedPid = await resolveManagedRegistryPid(registryAlreadyRunning)
  const managedRegistryRunning = managedPid !== null && isProcessRunning(managedPid)

  if (registryAlreadyRunning && !managedRegistryRunning) {
    throw new Error(
      `A registry is already running at ${registryUrl}, but it is not managed by the pipeline. Stop that process or use the lower-level registry commands manually.`,
    )
  }

  await stopManagedLocalRegistry()
  await rm(verdaccioStorageDir, { force: true, recursive: true })
  await startManagedLocalRegistry(registryUrl)
}

export async function cleanManagedLocalRegistry(): Promise<void> {
  await stopManagedLocalRegistry()
  await rm(registryStateDir, { force: true, recursive: true })
  await rm(verdaccioStoreDir, { force: true, recursive: true })
}