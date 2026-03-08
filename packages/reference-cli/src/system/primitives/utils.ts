export function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const className = parts.filter(Boolean).join(' ').trim()
  return className || undefined
}
