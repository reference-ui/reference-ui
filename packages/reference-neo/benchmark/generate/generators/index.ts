// Generator dispatch for bench repos.
// It takes a load plan plus a directory and emits the assembled project.
// The plan names the generator; numeric overrides bend the knobs without switching it.

import type { LoadPlan } from '../plans.ts'
import { assembleAppRepo } from './app.ts'
import { assembleChurnRepo } from './churn.ts'

export interface GeneratedStats {
  projectDir: string
  styleFiles: number
  deadFiles: number
  cssCalls: number
  recipes: number
}

export function generateRepo(plan: LoadPlan, dir: string): GeneratedStats {
  switch (plan.generator) {
    case 'churn':
      return assembleChurnRepo(plan, dir)
    case 'app':
      return assembleAppRepo(plan, dir)
  }
}
