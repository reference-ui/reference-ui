/** Env var: set to `1`, `true`, or `yes` (case-insensitive) to enable memory profiling. */
export const MEMORY_PROFILER_ENV = 'MEMORY_PROFILER'

export function isMemoryProfilerEnabled(): boolean {
  const raw = process.env[MEMORY_PROFILER_ENV]
  if (raw === undefined || raw === '') return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}
