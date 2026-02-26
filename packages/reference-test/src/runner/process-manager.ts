/**
 * Process lifecycle management.
 * Wraps execa for exec, Node spawn for long-running processes, tree-kill for termination.
 */

import { execa } from 'execa'
import { spawn } from 'node:child_process'
import treeKill from 'tree-kill'
import type { ChildProcess } from 'node:child_process'
import type { CommandResult } from './types.js'

const trackedProcesses = new Set<{ pid: number }>()

/**
 * Execute a command and return the result.
 */
export async function execCommand(
  command: string,
  args: string[],
  options: { cwd: string } = { cwd: process.cwd() }
): Promise<CommandResult> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd,
      reject: false,
    })
    return {
      success: result.exitCode === 0,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.exitCode ?? 0,
    }
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: String(err),
      exitCode: 1,
    }
  }
}

/**
 * Spawn a process. Returns child with pid for later kill.
 */
export function spawnProcess(
  command: string,
  args: string[],
  options: { cwd: string; env?: Record<string, string> } = { cwd: process.cwd() }
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : undefined,
    stdio: 'pipe',
  })
  if (child.pid) {
    trackedProcesses.add({ pid: child.pid })
  }
  return child
}

/**
 * Kill a process and its children.
 */
export function killTree(pid: number): Promise<void> {
  return new Promise((resolve) => {
    treeKill(pid, (err) => {
      trackedProcesses.delete({ pid })
      resolve()
    })
  })
}
