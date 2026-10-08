// Shared number formatting for Neo benchmark readouts.
// It takes raw bytes, milliseconds, and samples and emits human strings.
// The markdown readout and the JSON record both read from here, so a number never renders two ways.

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] as number
  const lower = sorted[middle - 1] as number
  const upper = sorted[middle] as number
  return (lower + upper) / 2
}

export function formatMiB(bytes: number): string {
  const mib = bytes / 1048576
  if (mib >= 1024) return `${(mib / 1024).toFixed(1)} GiB`
  return `${mib.toFixed(1)} MiB`
}

export function formatKiB(bytes: number): string {
  const kib = bytes / 1024
  if (kib >= 1024) return `${(kib / 1024).toFixed(1)} MiB`
  return `${kib.toFixed(1)} KiB`
}

export function formatMs(ms: number): string {
  if (ms >= 10000) return `${(ms / 1000).toFixed(1)}s`
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}
