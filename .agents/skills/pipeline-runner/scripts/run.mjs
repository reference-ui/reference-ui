#!/usr/bin/env node

/**
 * Miniature Agent CLI & Pipeline Runner
 *
 * Provides:
 * 1. Automatic macOS Darwin QoS Jailbreak (elevates child process from PRI 31 to PRI 46/47 via `taskpolicy -a`).
 * 2. Unbuffered output stream filtering (prevents \r carriage-return spinners from freezing in IDE logs).
 * 3. Targeted matrix testing and component verification commands.
 * 4. Optional Terminal Bridge Daemon mode (delegates jobs to external user terminal if running).
 */

import { spawn, spawnSync, execSync } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Locate repository root dynamically
export function findRepoRoot(startDir = __dirname) {
  let cur = startDir
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) return cur
    cur = path.dirname(cur)
  }
  return process.cwd()
}

const repoRoot = findRepoRoot(__dirname)
const SOCKET_PATH = path.join(os.tmpdir(), 'reference-ui-agent.sock')
const DAEMON_PID_FILE = path.join(os.tmpdir(), 'reference-ui-agent.pid')

// 2. Darwin QoS Jailbreak
function ensureQosJailbreak() {
  if (process.platform !== 'darwin') return false
  if (process.env.__AGENT_CLI_JAILBROKEN === '1') return false

  // Check if we are running under throttled QoS
  let currentPri = 31
  try {
    const priOutput = execSync(`ps -o pri= -p ${process.pid}`, { encoding: 'utf-8' }).trim()
    currentPri = parseInt(priOutput, 10) || 31
  } catch {
    // Ignore error
  }

  // If PRI is already high (e.g. >= 46), we are already in interactive tier
  if (currentPri >= 46) {
    process.env.__AGENT_CLI_JAILBROKEN = '1'
    return false
  }

  // Elevate priority using taskpolicy -a (application resource management policy)
  const args = [
    '-a', // Application QoS & resource management
    '-d', 'default', // Unthrottled disk I/O
    '-t', '0', // Throughput tier 0
    '-l', '0', // Latency tier 0
    process.execPath,
    __filename,
    ...process.argv.slice(2),
  ]

  const child = spawn('taskpolicy', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      __AGENT_CLI_JAILBROKEN: '1',
      FORCE_COLOR: '1',
    },
    cwd: process.cwd(),
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
    } else {
      process.exit(code ?? 0)
    }
  })

  // Indicate that parent spawned child and should not continue
  return true
}

// 3. Status Inspector
function getSystemStatus() {
  let pri = 'unknown'
  let flags = 'unknown'
  try {
    const psOut = execSync(`ps -o pri=,flags= -p ${process.pid}`, { encoding: 'utf-8' }).trim()
    const parts = psOut.split(/\s+/)
    pri = parts[0]
    flags = parts[1]
  } catch {}

  let dockerContext = 'unavailable'
  let dockerOk = false
  try {
    dockerContext = execSync('docker context show', { encoding: 'utf-8' }).trim()
    execSync('docker version', { stdio: 'ignore' })
    dockerOk = true
  } catch {}

  let verdaccioOk = false
  try {
    execSync('curl -s -f -o /dev/null http://127.0.0.1:4873/-/ping', { timeout: 1500 })
    verdaccioOk = true
  } catch {}

  let daemonActive = false
  if (fs.existsSync(SOCKET_PATH)) {
    try {
      const client = net.createConnection(SOCKET_PATH)
      client.destroy()
      daemonActive = true
    } catch {
      // Stale socket
      try { fs.unlinkSync(SOCKET_PATH) } catch {}
    }
  }

  return {
    pid: process.pid,
    platform: process.platform,
    qosPriority: pri,
    processFlags: flags,
    jailbroken: process.env.__AGENT_CLI_JAILBROKEN === '1' || parseInt(pri, 10) >= 46,
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    dockerContext,
    dockerOk,
    verdaccioOk,
    daemonActive,
  }
}

// 4. Stream unbuffering helper for spawn
function spawnWithCleanStream(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const spawnCmd = process.platform === 'darwin' ? 'taskpolicy' : cmd
    const spawnArgs = process.platform === 'darwin'
      ? ['-a', '-d', 'default', '-t', '0', '-l', '0', cmd, ...args]
      : args

    const child = spawn(spawnCmd, spawnArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...options.env,
        FORCE_COLOR: '1',
      },
      cwd: options.cwd || repoRoot,
    })

    const cleanLine = (chunk, isStderr = false) => {
      const str = chunk.toString()
      const lines = str.split('\r')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('\n')) {
          const sublines = line.split('\n')
          for (let j = 0; j < sublines.length; j++) {
            if (j > 0) {
              (isStderr ? process.stderr : process.stdout).write('\n')
            }
            (isStderr ? process.stderr : process.stdout).write(sublines[j])
          }
        } else if (line.trim().length > 0) {
          if (!process.stdout.isTTY) {
            (isStderr ? process.stderr : process.stdout).write(`[agent] ${line.trim()}\n`)
          } else {
            (isStderr ? process.stderr : process.stdout).write(line)
          }
        }
      }
    }

    child.stdout.on('data', (chunk) => cleanLine(chunk, false))
    child.stderr.on('data', (chunk) => cleanLine(chunk, true))

    child.on('exit', (code, signal) => {
      resolve({ code: code ?? (signal ? 1 : 0), signal })
    })

    child.on('error', (err) => {
      console.error(`[agent] Failed to execute ${cmd}:`, err.message)
      resolve({ code: 1, error: err })
    })
  })
}

// 5. Terminal Bridge Daemon
function startDaemon() {
  if (fs.existsSync(SOCKET_PATH)) {
    try {
      fs.unlinkSync(SOCKET_PATH)
    } catch {}
  }

  const server = net.createServer((socket) => {
    let buffer = ''
    socket.on('data', async (chunk) => {
      buffer += chunk.toString()
      if (buffer.endsWith('\n')) {
        const line = buffer.trim()
        buffer = ''
        try {
          const req = JSON.parse(line)
          console.log(`\n[agent-daemon] Executing: ${req.cmd} ${req.args.join(' ')}`)

          const child = spawn(req.cmd, req.args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: req.cwd || repoRoot,
            env: { ...process.env, ...req.env, FORCE_COLOR: '1' },
          })

          child.stdout.on('data', (data) => {
            process.stdout.write(data)
            socket.write(JSON.stringify({ type: 'stdout', data: data.toString() }) + '\n')
          })

          child.stderr.on('data', (data) => {
            process.stderr.write(data)
            socket.write(JSON.stringify({ type: 'stderr', data: data.toString() }) + '\n')
          })

          child.on('exit', (code, signal) => {
            console.log(`[agent-daemon] Finished with code ${code ?? 0}`)
            socket.write(JSON.stringify({ type: 'exit', code: code ?? 0, signal }) + '\n')
            socket.end()
          })
        } catch (err) {
          socket.write(JSON.stringify({ type: 'error', error: err.message }) + '\n')
          socket.end()
        }
      }
    })
  })

  server.listen(SOCKET_PATH, () => {
    fs.writeFileSync(DAEMON_PID_FILE, String(process.pid))
    console.log(`[agent-daemon] Reference UI Agent Daemon listening at ${SOCKET_PATH}`)
    console.log(`[agent-daemon] PID: ${process.pid} (Interactive priority: PRI ${getSystemStatus().qosPriority})`)
    console.log('[agent-daemon] Keep this terminal open to run agent tasks with full host resources.')
  })

  const cleanup = () => {
    try { fs.unlinkSync(SOCKET_PATH) } catch {}
    try { fs.unlinkSync(DAEMON_PID_FILE) } catch {}
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)
}

// 6. Execute via daemon or fallback to direct execution
async function runCommand(cmd, args, options = {}) {
  if (fs.existsSync(SOCKET_PATH)) {
    return new Promise((resolve) => {
      const client = net.createConnection(SOCKET_PATH, () => {
        console.log(`[agent] Connected to terminal daemon at ${SOCKET_PATH}`)
        client.write(JSON.stringify({ cmd, args, cwd: options.cwd || repoRoot, env: options.env }) + '\n')
      })

      client.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'stdout') process.stdout.write(msg.data)
            if (msg.type === 'stderr') process.stderr.write(msg.data)
            if (msg.type === 'exit') {
              client.end()
              resolve({ code: msg.code })
            }
          } catch {}
        }
      })

      client.on('error', () => {
        console.log('[agent] Daemon unreachable, falling back to direct execution...')
        resolve(spawnWithCleanStream(cmd, args, options))
      })
    })
  }

  return spawnWithCleanStream(cmd, args, options)
}

// 7. CLI Actions
async function actionStatus() {
  const status = getSystemStatus()
  console.log('\n========================================')
  console.log(' Reference UI Agent Environment Status  ')
  console.log('========================================')
  console.log(`Platform:          ${status.platform} (${status.cpus} CPUs, ${status.cpuModel})`)
  console.log(`Darwin Priority:   PRI ${status.qosPriority} (Flags: ${status.processFlags})`)
  console.log(`QoS Jailbroken:    ${status.jailbroken ? '✔ YES (Application tier, unthrottled)' : '✖ NO (Clamped)'}`)
  console.log(`Docker Runtime:    ${status.dockerOk ? `✔ Active (${status.dockerContext})` : '✖ Inactive'}`)
  console.log(`Verdaccio Registry:${status.verdaccioOk ? '✔ Active (http://127.0.0.1:4873)' : '✖ Inactive'}`)
  console.log(`Terminal Bridge:   ${status.daemonActive ? `✔ Connected (${SOCKET_PATH})` : '○ Idle (Direct Mode)'}`)
  console.log('========================================\n')
}

async function actionTest(args) {
  const pnpmArgs = ['pipeline', 'test', ...args]
  console.log(`[agent] Executing unthrottled: pnpm ${pnpmArgs.join(' ')}`)
  const result = await runCommand('pnpm', pnpmArgs)
  process.exit(result.code)
}

async function actionVerify(componentName) {
  if (!componentName) {
    console.error('[agent] Error: Please specify a component name, e.g.: pnpm agent verify Toast')
    process.exit(1)
  }

  const normalized = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .trim()

  console.log(`\n========================================`)
  console.log(` Verifying Component: ${componentName} `)
  console.log(`========================================\n`)

  // Step 1: Typecheck
  console.log('Step 1/4: Typechecking @reference-ui/lib...')
  let res = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'run', 'typecheck'])
  if (res.code !== 0) {
    console.error('\n✖ Step 1 failed: Typecheck errors found.')
    process.exit(res.code)
  }
  console.log('✔ Typecheck passed.\n')

  // Step 2: Unit tests
  console.log('Step 2/4: Running Vitest unit tests...')
  res = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'test'])
  if (res.code !== 0) {
    console.error('\n✖ Step 2 failed: Unit tests failed.')
    process.exit(res.code)
  }
  console.log('✔ Unit tests passed.\n')

  // Step 3: Build library
  console.log('Step 3/4: Building @reference-ui/lib for matrix consumption...')
  res = await runCommand('pnpm', ['--filter', '@reference-ui/lib', 'run', 'build'], {
    env: { REF_PIPELINE_SKIP_DEPENDENCY_BUILDS: '1' },
  })
  if (res.code !== 0) {
    console.error('\n✖ Step 3 failed: Library build failed.')
    process.exit(res.code)
  }
  console.log('✔ Library build completed.\n')

  // Step 4: Targeted E2E check
  const specPath = path.join(repoRoot, `matrix/lib/tests/e2e/${normalized}.spec.ts`)
  if (fs.existsSync(specPath)) {
    console.log(`Step 4/4: Running Playwright E2E spec (${normalized}.spec.ts)...`)
    res = await runCommand('pnpm', [
      '--dir', 'matrix/lib',
      'exec', 'playwright', 'test',
      `tests/e2e/${normalized}.spec.ts`,
    ])
    if (res.code !== 0) {
      console.error('\n✖ Step 4 failed: Browser E2E spec failed.')
      process.exit(res.code)
    }
    console.log(`✔ E2E spec passed.\n`)
  } else {
    console.log(`Step 4/4: No dedicated E2E spec found at tests/e2e/${normalized}.spec.ts. Running smoke test...`)
    res = await runCommand('pnpm', [
      '--dir', 'matrix/lib',
      'exec', 'playwright', 'test',
      'tests/e2e/smoke.spec.ts',
    ])
    if (res.code !== 0) {
      console.error('\n✖ Step 4 failed: Smoke test failed.')
      process.exit(res.code)
    }
    console.log(`✔ Smoke test passed.\n`)
  }

  console.log(`========================================`)
  console.log(` All 4 Verification Steps Passed for ${componentName}! `)
  console.log(`========================================\n`)
}

// 8. Programmatic Matrix & Pipeline API
export {
  runCommand,
  getSystemStatus,
  actionStatus,
  actionTest,
  actionVerify,
}

/**
 * Programmatic runner for matrix tests through the pipeline.
 * Ensures Darwin QoS elevation and unbuffered output streaming.
 */
export async function runMatrix(options = {}) {
  const args = []
  if (options.packages) args.push(`--packages=${options.packages}`)
  if (options.react) args.push(`--react=${options.react}`)
  if (options.full) args.push('--full')
  if (options.trace) args.push('--trace')
  return runCommand('pnpm', ['pipeline', 'test', ...args])
}

/**
 * Programmatic pass-through to any pipeline CLI command with QoS elevation.
 */
export async function runPipeline(subcommand, args = []) {
  const fullArgs = typeof subcommand === 'string' ? [subcommand, ...args] : subcommand
  return runCommand('pnpm', ['pipeline', ...fullArgs])
}

// 9. Main CLI Entrypoint
async function main() {
  if (ensureQosJailbreak()) {
    return
  }

  const args = process.argv.slice(2)
  const command = args[0] || 'status'

  switch (command) {
    case 'status':
      await actionStatus()
      break

    case 'daemon':
      startDaemon()
      break

    case 'test': {
      let testArgs = args.slice(1)
      // Allow syntax like: pnpm agent test matrix [options]
      if (testArgs[0] === 'matrix') {
        testArgs = testArgs.slice(1)
      }
      await actionTest(testArgs)
      break
    }

    case 'test:matrix':
      // Full matrix run (equivalent to pnpm pipeline:test:matrix / pipeline test --full)
      await actionTest(['--full', ...args.slice(1)])
      break

    case 'matrix': {
      // Allow syntax like: pnpm agent matrix [options] or pnpm agent matrix test [options]
      const sub = args[1]
      if (sub === 'test' || sub === 'test:matrix') {
        const extra = sub === 'test:matrix' ? ['--full'] : []
        await actionTest([...extra, ...args.slice(2)])
      } else {
        await actionTest(args.slice(1))
      }
      break
    }

    case 'pipeline':
      console.log(`[agent] Running pipeline command unthrottled: pnpm pipeline ${args.slice(1).join(' ')}`)
      const pipeRes = await runCommand('pnpm', ['pipeline', ...args.slice(1)])
      process.exit(pipeRes.code)
      break

    case 'verify':
      await actionVerify(args[1])
      break

    case 'help':
    case '--help':
    case '-h':
      console.log(`
Miniature Reference UI Agent CLI

Usage:
  pnpm agent status                     Check QoS priority, Docker, and daemon state
  pnpm agent test [options]             Run unthrottled matrix test (wraps pnpm pipeline test)
  pnpm agent test matrix [options]      Alias for pnpm agent test
  pnpm agent test:matrix [options]      Run full matrix test (wraps pipeline test --full)
  pnpm agent matrix [options]           Alias for matrix testing
  pnpm agent pipeline <command>         Run any pipeline command unthrottled
  pnpm agent verify <Component>         Run 4-phase verification (typecheck -> vitest -> build -> e2e)
  pnpm agent daemon                     Start terminal bridge daemon in current terminal
  pnpm agent help                       Show this help message

Options for test / matrix:
  --packages <names>                    e.g. @matrix/lib or @matrix/tokens
  --react <runtime>                     e.g. react17, react18, react19
  --full                                Expand all declared React runtimes and bundlers
  --trace                               Stream Dagger engine traces

Programmatic API:
  import { runMatrix, runPipeline } from './.agents/skills/pipeline-runner/scripts/run.mjs'
  await runMatrix({ packages: '@matrix/tokens', react: 'react19' })
`)
      break

    default:
      console.log(`[agent] Passing through to pipeline: ${args.join(' ')}`)
      const res = await runCommand('pnpm', ['pipeline', ...args])
      process.exit(res.code)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('[agent] Fatal error:', err)
    process.exit(1)
  })
}

