export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      fn(...args)
    }, ms)
  }) as T
}
