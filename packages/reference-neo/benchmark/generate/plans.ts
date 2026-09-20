// Benchmark load plans for the Neo sync harness.
// It takes scale names plus CLI overrides and emits resolved LoadPlans.
// Each scale names a generator plus numeric knobs; overrides bend the knobs, never the generator.
// Custom overrides turn any scale into an ad-hoc plan without touching code.

export interface LoadPlan {
  scale: string
  generator: 'churn' | 'app'
  optIn: boolean
  seed: number
  defaultRuns: number
  files: number
  deadFiles: number
  minCalls: number
  maxCalls: number
  tokenColors: number
  tokenSpacing: number
  recipes: number
  uniqueRatio: number
  conditionRatio: number
  responsiveRatio: number
}

export interface PlanOverrides {
  seed?: number
  files?: number
  calls?: number
  unique?: number
}

const PROFILES: Record<string, LoadPlan> = {
  small: {
    scale: 'small',
    generator: 'app',
    optIn: false,
    seed: 7,
    defaultRuns: 3,
    files: 60,
    deadFiles: 240,
    minCalls: 1,
    maxCalls: 4,
    tokenColors: 80,
    tokenSpacing: 30,
    recipes: 6,
    uniqueRatio: 0.15,
    conditionRatio: 0.25,
    responsiveRatio: 0.2,
  },
  medium: {
    scale: 'medium',
    generator: 'app',
    optIn: false,
    seed: 7,
    defaultRuns: 3,
    files: 250,
    deadFiles: 1000,
    minCalls: 1,
    maxCalls: 4,
    tokenColors: 150,
    tokenSpacing: 48,
    recipes: 24,
    uniqueRatio: 0.25,
    conditionRatio: 0.3,
    responsiveRatio: 0.25,
  },
  enterprise: {
    scale: 'enterprise',
    generator: 'app',
    optIn: false,
    seed: 7,
    defaultRuns: 1,
    files: 3000,
    deadFiles: 12000,
    minCalls: 1,
    maxCalls: 4,
    tokenColors: 300,
    tokenSpacing: 64,
    recipes: 120,
    uniqueRatio: 0.35,
    conditionRatio: 0.35,
    responsiveRatio: 0.3,
  },
  churn: {
    scale: 'churn',
    generator: 'churn',
    optIn: true,
    seed: 7,
    defaultRuns: 1,
    files: 4000,
    deadFiles: 2000,
    minCalls: 8,
    maxCalls: 14,
    tokenColors: 300,
    tokenSpacing: 64,
    recipes: 120,
    uniqueRatio: 0.65,
    conditionRatio: 0.4,
    responsiveRatio: 0.3,
  },
}

export function listProfiles(): LoadPlan[] {
  return Object.values(PROFILES).map((plan) => ({ ...plan }))
}

function clampInt(value: number, fallback: number, min: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.floor(value))
}

function clampRatio(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

function applyNumericOverrides(plan: LoadPlan, overrides: PlanOverrides): LoadPlan {
  const next: LoadPlan = { ...plan }
  if (overrides.seed !== undefined) next.seed = clampInt(overrides.seed, plan.seed, 0)
  if (overrides.files !== undefined) next.files = clampInt(overrides.files, plan.files, 1)
  if (overrides.calls !== undefined) {
    const calls = clampInt(overrides.calls, plan.minCalls, 1)
    next.minCalls = calls
    next.maxCalls = calls
  }
  return next
}

function isCustom(overrides: PlanOverrides): boolean {
  return (
    overrides.seed !== undefined
    || overrides.files !== undefined
    || overrides.calls !== undefined
    || overrides.unique !== undefined
  )
}

function applyOverrides(plan: LoadPlan, overrides: PlanOverrides): LoadPlan {
  const next = applyNumericOverrides(plan, overrides)
  if (overrides.unique !== undefined) next.uniqueRatio = clampRatio(overrides.unique, plan.uniqueRatio)
  if (isCustom(overrides)) next.scale = `${plan.scale}+custom`
  return next
}

export function resolvePlan(scale: string, overrides: PlanOverrides): LoadPlan {
  const base = PROFILES[scale]
  if (!base) {
    const known = Object.keys(PROFILES).join(', ')
    throw new Error(`unknown bench scale: ${scale} (known: ${known})`)
  }
  return applyOverrides(base, overrides)
}

function defaultSuite(): string[] {
  return Object.values(PROFILES).filter((plan) => !plan.optIn).map((plan) => plan.scale)
}

export function resolveScales(raw: string | undefined): string[] {
  if (raw === undefined) return defaultSuite()
  const names = raw.split(',').map((name) => name.trim()).filter((name) => name.length > 0)
  if (names.length === 0) return defaultSuite()
  for (const name of names) {
    if (!PROFILES[name]) {
      const known = Object.keys(PROFILES).join(', ')
      throw new Error(`unknown bench scale: ${name} (known: ${known})`)
    }
  }
  return [...new Set(names)]
}
