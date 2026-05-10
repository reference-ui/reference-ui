import { spawnSync } from 'node:child_process'

interface ContainerRuntimeOptions {
  commandLabel?: string
  minimumDockerCpuCount?: number
  minimumDockerDiskFreeBytes?: number
  minimumDockerMemoryBytes?: number
}

interface ColimaStatus {
  display_name?: string
  cpu?: number
  disk?: number
  memory?: number
}

export interface DockerRuntimeInfo {
  context: string | null
  cpuCount: number | null
  diskFreeBytes: number | null
  diskTotalBytes: number | null
  diskUsedBytes: number | null
  memoryBytes: number | null
}

interface DockerSystemDfRow {
  Active?: string
  Reclaimable?: string
  Size?: string
  TotalCount?: string
  Type?: string
}

function isMacOs(): boolean {
  return process.platform === 'darwin'
}

function runCommand(command: string, args: string[], options: { timeoutMs?: number } = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeoutMs,
  })
}

function commandAvailable(command: string): boolean {
  const result = runCommand('sh', ['-lc', `command -v ${command}`])
  return result.status === 0
}

function getDockerContext(): string | null {
  const result = runCommand('docker', ['context', 'show'])
  if (result.status !== 0) {
    return null
  }

  return result.stdout.trim() || null
}

function dockerReachable(): boolean {
  return runCommand('docker', ['version'], { timeoutMs: 5_000 }).status === 0
}

function dockerDaemonReady(): boolean {
  // `docker info` performs a real daemon round-trip and is what downstream
  // pipeline calls (Dagger, `docker system df`, etc.) immediately rely on.
  return runCommand('docker', ['info'], { timeoutMs: 5_000 }).status === 0
}

function waitForDockerDaemon(timeoutMs = 60_000): boolean {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (dockerDaemonReady()) {
      return true
    }
    // Brief blocking wait between polls; spawnSync already paces us when the
    // call times out, so this is only meaningful for fast failures.
    const sleepResult = spawnSync('sh', ['-lc', 'sleep 1'])
    if (sleepResult.status !== 0) {
      break
    }
  }
  return dockerDaemonReady()
}

function getDockerMemoryBytes(): number | null {
  const result = runCommand('docker', ['info', '--format', '{{json .MemTotal}}'])

  if (result.status !== 0) {
    return null
  }

  const value = Number.parseInt(result.stdout.trim(), 10)
  return Number.isFinite(value) ? value : null
}

function getDockerCpuCount(): number | null {
  const result = runCommand('docker', ['info', '--format', '{{json .NCPU}}'])

  if (result.status !== 0) {
    return null
  }

  const value = Number.parseInt(result.stdout.trim(), 10)
  return Number.isFinite(value) ? value : null
}

function getColimaDiskBytes(): number | null {
  const colimaStatus = getColimaStatus()

  if (!colimaStatus || typeof colimaStatus.disk !== 'number' || !Number.isFinite(colimaStatus.disk)) {
    return null
  }

  return colimaStatus.disk
}

export function parseDockerSizeToBytes(size: string): number | null {
  const trimmedSize = size.trim()

  if (trimmedSize === '0B') {
    return 0
  }

  const match = trimmedSize.match(/^(\d+(?:\.\d+)?)([KMGTPE]?B)$/i)

  if (!match) {
    return null
  }

  const value = Number.parseFloat(match[1])

  if (!Number.isFinite(value)) {
    return null
  }

  const unit = match[2].toUpperCase()
  const exponentByUnit: Record<string, number> = {
    B: 0,
    KB: 1,
    MB: 2,
    GB: 3,
    TB: 4,
    PB: 5,
    EB: 6,
  }
  const exponent = exponentByUnit[unit]

  if (exponent === undefined) {
    return null
  }

  return Math.round(value * (1000 ** exponent))
}

export function parseDockerSystemDfUsageBytes(output: string): number | null {
  const lines = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length === 0) {
    return null
  }

  let totalBytes = 0

  for (const line of lines) {
    let row: DockerSystemDfRow

    try {
      row = JSON.parse(line) as DockerSystemDfRow
    } catch {
      return null
    }

    const sizeBytes = typeof row.Size === 'string' ? parseDockerSizeToBytes(row.Size) : null

    if (sizeBytes === null) {
      return null
    }

    totalBytes += sizeBytes
  }

  return totalBytes
}

function getDockerDiskUsageBytes(): number | null {
  const result = runCommand('docker', ['system', 'df', '--format', '{{json .}}'])

  if (result.status !== 0) {
    return null
  }

  return parseDockerSystemDfUsageBytes(result.stdout)
}

export function getDockerRuntimeInfo(): DockerRuntimeInfo {
  const context = getDockerContext()
  const diskTotalBytes = context === 'colima' ? getColimaDiskBytes() : null
  const diskUsedBytes = getDockerDiskUsageBytes()

  return {
    context,
    cpuCount: getDockerCpuCount(),
    diskFreeBytes:
      diskTotalBytes !== null && diskUsedBytes !== null
        ? Math.max(0, diskTotalBytes - diskUsedBytes)
        : null,
    diskTotalBytes,
    diskUsedBytes,
    memoryBytes: getDockerMemoryBytes(),
  }
}

function formatGiB(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`
}

function formatCpuCount(cpuCount: number): string {
  return `${cpuCount} CPU${cpuCount === 1 ? '' : 's'}`
}

function formatRequiredDockerResources(options: ContainerRuntimeOptions): string {
  const parts: string[] = []

  if (options.minimumDockerCpuCount) {
    parts.push(formatCpuCount(options.minimumDockerCpuCount))
  }

  if (options.minimumDockerMemoryBytes) {
    parts.push(formatGiB(options.minimumDockerMemoryBytes))
  }

  if (options.minimumDockerDiskFreeBytes) {
    parts.push(`${formatGiB(options.minimumDockerDiskFreeBytes)} free disk`)
  }

  return parts.join(' and ')
}

function formatDetectedDockerResources(runtime: DockerRuntimeInfo): string {
  const parts: string[] = []

  if (runtime.cpuCount !== null) {
    parts.push(formatCpuCount(runtime.cpuCount))
  }

  if (runtime.memoryBytes !== null) {
    parts.push(formatGiB(runtime.memoryBytes))
  }

  if (runtime.diskFreeBytes !== null) {
    parts.push(`${formatGiB(runtime.diskFreeBytes)} free disk`)
  }

  return parts.length === 0 ? 'unknown resources' : parts.join(' and ')
}

function needsMoreDockerCpu(options: ContainerRuntimeOptions, cpuCount: number | null): boolean {
  return Boolean(options.minimumDockerCpuCount && cpuCount !== null && cpuCount < options.minimumDockerCpuCount)
}

function needsMoreDockerMemory(options: ContainerRuntimeOptions, memoryBytes: number | null): boolean {
  return Boolean(
    options.minimumDockerMemoryBytes &&
    memoryBytes !== null &&
    memoryBytes < options.minimumDockerMemoryBytes
  )
}

function needsMoreDockerDiskFreeSpace(options: ContainerRuntimeOptions, runtime: DockerRuntimeInfo): boolean {
  return Boolean(
    options.minimumDockerDiskFreeBytes &&
    runtime.diskFreeBytes !== null &&
    runtime.diskFreeBytes < options.minimumDockerDiskFreeBytes
  )
}

function needsMoreDockerResources(options: ContainerRuntimeOptions, runtime: DockerRuntimeInfo): boolean {
  return needsMoreDockerCpu(options, runtime.cpuCount) || needsMoreDockerMemory(options, runtime.memoryBytes)
}

function requiredColimaMemoryGiB(minimumDockerMemoryBytes: number): string {
  const gib = minimumDockerMemoryBytes / (1024 ** 3)
  return Number.isInteger(gib) ? String(gib) : gib.toFixed(1)
}

function getDesiredColimaStartOptions(options: ContainerRuntimeOptions): {
  cpuCount?: number
  memoryGiB?: string
} {
  return {
    cpuCount: options.minimumDockerCpuCount,
    memoryGiB: options.minimumDockerMemoryBytes
      ? requiredColimaMemoryGiB(options.minimumDockerMemoryBytes)
      : undefined,
  }
}

function getColimaStatus(): ColimaStatus | null {
  const result = runCommand('colima', ['status', '--json'])

  if (result.status !== 0) {
    return null
  }

  try {
    return JSON.parse(result.stdout) as ColimaStatus
  } catch {
    return null
  }
}

function colimaStatusSatisfiesRequirements(
  options: ContainerRuntimeOptions,
  colimaStatus: ColimaStatus | null,
): boolean {
  if (!colimaStatus) {
    return false
  }

  const cpuSatisfied =
    !options.minimumDockerCpuCount ||
    (typeof colimaStatus.cpu === 'number' && colimaStatus.cpu >= options.minimumDockerCpuCount)

  const memorySatisfied =
    !options.minimumDockerMemoryBytes ||
    (typeof colimaStatus.memory === 'number' && colimaStatus.memory >= options.minimumDockerMemoryBytes)

  return cpuSatisfied && memorySatisfied
}

function stopColima(): void {
  const result = spawnSync('colima', ['stop'], {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error('Failed to stop Colima automatically before resizing. Run `colima stop` and retry.')
  }
}

function startColima(options: { cpuCount?: number; memoryGiB?: string } = {}): void {
  const args = ['start']

  if (options.cpuCount) {
    args.push('--cpu', String(options.cpuCount))
  }

  if (options.memoryGiB) {
    args.push('--memory', options.memoryGiB)
  }

  const result = spawnSync('colima', args, {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    const retryArgs = args.slice(1).join(' ')
    const retryCommand = retryArgs.length > 0 ? `colima start ${retryArgs}` : 'colima start'
    throw new Error(`Failed to start Colima automatically. Run \`${retryCommand}\` and retry.`)
  }
}

function ensureColimaResources(options: ContainerRuntimeOptions, runtime: DockerRuntimeInfo): void {
  if (!needsMoreDockerResources(options, runtime)) {
    return
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const requiredResources = formatRequiredDockerResources(options)
  const detectedResources = formatDetectedDockerResources(runtime)
  const desiredColimaStartOptions = getDesiredColimaStartOptions(options)
  const desiredArgs = [
    desiredColimaStartOptions.cpuCount ? `--cpu ${desiredColimaStartOptions.cpuCount}` : null,
    desiredColimaStartOptions.memoryGiB ? `--memory ${desiredColimaStartOptions.memoryGiB}` : null,
  ].filter((value): value is string => value !== null)
  const desiredArgText = desiredArgs.join(' ')

  console.log(
    `${commandLabel} requires at least ${requiredResources}, but Colima currently exposes ${detectedResources}. Restarting Colima with ${desiredArgText}...`
  )

  stopColima()
  startColima(desiredColimaStartOptions)

  if (!waitForDockerDaemon()) {
    throw new Error('Colima restarted, but the Docker daemon did not become ready. Check `docker info` and retry.')
  }

  const restartedColimaStatus = getColimaStatus()
  if (colimaStatusSatisfiesRequirements(options, restartedColimaStatus)) {
    return
  }

  const restartedRuntime = getDockerRuntimeInfo()
  if (!needsMoreDockerResources(options, restartedRuntime)) {
    return
  }

  const manualCommand = `colima stop && colima start ${desiredArgText}`
  throw new Error(
    `${commandLabel} requires at least ${requiredResources}, but Colima still reports ${formatDetectedDockerResources(restartedRuntime)} after restart. Run \`${manualCommand}\` manually and retry.`
  )
}

function assertDockerResources(options: ContainerRuntimeOptions): void {
  if (!options.minimumDockerCpuCount && !options.minimumDockerMemoryBytes) {
    if (!options.minimumDockerDiskFreeBytes) {
      return
    }
  }

  const runtime = getDockerRuntimeInfo()
  const lacksCpuOrMemory = needsMoreDockerResources(options, runtime)
  const lacksDiskFreeSpace = needsMoreDockerDiskFreeSpace(options, runtime)

  if (!lacksCpuOrMemory && !lacksDiskFreeSpace) {
    return
  }

  if (lacksDiskFreeSpace) {
    const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
    const requiredResources = formatRequiredDockerResources(options)
    const dockerContext = runtime.context

    if (isMacOs() && dockerContext === 'colima' && commandAvailable('colima')) {
      const freeDisk = runtime.diskFreeBytes === null ? 'unknown free disk' : formatGiB(runtime.diskFreeBytes)
      const usedDisk = runtime.diskUsedBytes === null ? 'unknown used disk' : formatGiB(runtime.diskUsedBytes)
      const totalDisk = runtime.diskTotalBytes === null ? 'unknown total disk' : formatGiB(runtime.diskTotalBytes)

      throw new Error(
        `${commandLabel} requires at least ${requiredResources}, but Colima currently has ${freeDisk} free (${usedDisk} used of ${totalDisk} total). Run \`pnpm pipeline clean\` to clear pipeline and Dagger caches, or reclaim Docker disk / restart Colima with a larger disk via \`colima stop && colima start --disk 160\`, then retry.`
      )
    }

    throw new Error(
      `${commandLabel} requires at least ${requiredResources}, but Docker currently reports ${formatDetectedDockerResources(runtime)}. Reclaim Docker disk space and retry.`
    )
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const requiredResources = formatRequiredDockerResources(options)
  const dockerContext = runtime.context

  if (isMacOs() && dockerContext === 'colima' && commandAvailable('colima')) {
    const colimaStatus = getColimaStatus()
    const diskTotalBytes = colimaStatus?.disk ?? runtime.diskTotalBytes
    ensureColimaResources(options, {
      context: dockerContext,
      cpuCount: colimaStatus?.cpu ?? runtime.cpuCount,
      diskFreeBytes:
        diskTotalBytes !== null && runtime.diskUsedBytes !== null
          ? Math.max(0, diskTotalBytes - runtime.diskUsedBytes)
          : runtime.diskFreeBytes,
      diskTotalBytes,
      diskUsedBytes: runtime.diskUsedBytes,
      memoryBytes: colimaStatus?.memory ?? runtime.memoryBytes,
    })
    return
  }

  throw new Error(
    `${commandLabel} requires at least ${requiredResources}, but Docker currently reports ${formatDetectedDockerResources(runtime)}. Increase the Docker backend CPU or memory allocation and retry.`
  )
}

function colimaRunning(): boolean {
  const result = runCommand('colima', ['status'])
  return result.status === 0 && /^status:.*running/im.test(result.stdout)
}

export function ensureContainerRuntime(options: ContainerRuntimeOptions = {}): void {
  if (!isMacOs()) {
    return
  }

  if (!commandAvailable('docker')) {
    throw new Error('Docker CLI is required for the Dagger pipeline. Run `pnpm setup:local` first.')
  }

  if (dockerReachable()) {
    assertDockerResources(options)
    return
  }

  const dockerContext = getDockerContext()
  if (dockerContext !== 'colima') {
    throw new Error(
      'Docker is not reachable for the Dagger pipeline. Start your Docker backend or switch to the `colima` Docker context.'
    )
  }

  if (!commandAvailable('colima')) {
    throw new Error('Colima is required for the active Docker context. Run `pnpm setup:local` first.')
  }

  if (colimaRunning()) {
    if (!waitForDockerDaemon()) {
      throw new Error('Colima reports running, but the Docker daemon did not become ready. Check `docker info` and your Docker context.')
    }
    assertDockerResources(options)
    return
  }

  console.log('Docker context is `colima` but the VM is not running. Starting Colima...')
  startColima(getDesiredColimaStartOptions(options))

  if (!waitForDockerDaemon()) {
    throw new Error('Colima started, but the Docker daemon did not become ready. Check `docker info` and retry.')
  }

  assertDockerResources(options)
}