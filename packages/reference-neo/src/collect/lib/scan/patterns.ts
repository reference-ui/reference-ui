// Discovery patterns for fragment file scanning.
// They take import module ids or function names and emit the regex-plus-needle
// records the TS scan and the native needle union share. The needle is the
// literal bytes every match contains, so the includes pre-gate can skip the
// regex without changing selection.
export interface DiscoveryPattern {
  pattern: RegExp
  /** Literal bytes every match contains; the includes pre-gate. */
  needle: string
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toArray(value?: string | string[]): string[] {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

export function createImportPatterns(importFrom?: string | string[]): DiscoveryPattern[] {
  return toArray(importFrom).map((moduleId) => ({
    pattern: new RegExp(
      `\\bfrom\\s*['"]${escapeRegex(moduleId)}['"]|\\bimport\\s*['"]${escapeRegex(moduleId)}['"]`,
      'm',
    ),
    needle: moduleId,
  }))
}

export function createFunctionPatterns(functionNames?: string[]): DiscoveryPattern[] {
  return (functionNames ?? []).map((name) => ({
    pattern: new RegExp(`\\b${name}\\s*\\(`),
    needle: name,
  }))
}
