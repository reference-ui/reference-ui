/**
 * Test station execution helpers for virtualrs compiler transforms.
 * Discovers case directories, executes AST rewrites via the native Node-API runtime,
 * and records performance metrics for each test case execution.
 * Provides result wrappers and directory anchors for declarative station testing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import type { StationContext } from '../../../testing/index.js'
import {
  applyResponsiveStyles,
  replaceFunctionName,
  rewriteCssImports,
  rewriteCvaImports,
} from '../js/runtime.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CASES_DIR = path.resolve(__dirname, 'cases')
export const CASE_FOLDER = /^(VRT-[A-Z]+-\d{2})-.+$/

export interface VirtualResult {
  code: string
  metrics: {
    rustApiMs: number
  }
}

export interface VirtualCaseConfig {
  api: 'rewriteCssImports' | 'rewriteCvaImports' | 'replaceFunctionName' | 'applyResponsiveStyles'
  fromName?: string
  importFrom?: string
  relativePath: string
  inputFile?: string
  outputFile?: string
  toName?: string
}

function executeReplaceFunctionName(source: string, config: VirtualCaseConfig): string {
  if (!config.fromName || !config.toName) {
    throw new Error('replaceFunctionName cases require fromName and toName in case.json')
  }
  return replaceFunctionName(
    source,
    config.relativePath,
    config.fromName,
    config.toName,
    config.importFrom
  )
}

function executeRewrite(source: string, config: VirtualCaseConfig): string {
  if (config.api === 'rewriteCssImports') {
    return rewriteCssImports(source, config.relativePath)
  }
  if (config.api === 'rewriteCvaImports') {
    return rewriteCvaImports(source, config.relativePath)
  }
  if (config.api === 'applyResponsiveStyles') {
    return applyResponsiveStyles(source, config.relativePath)
  }
  if (config.api === 'replaceFunctionName') {
    return executeReplaceFunctionName(source, config)
  }
  throw new Error(`Unsupported virtualrs API: ${(config as VirtualCaseConfig).api}`)
}

function readSourceCode(ctx: StationContext, config: VirtualCaseConfig): string {
  const fileName = config.inputFile ?? 'input.tsx'
  const inInputDir = path.join(ctx.inputDir, fileName)
  if (fs.existsSync(inInputDir)) {
    return fs.readFileSync(inInputDir, 'utf-8')
  }
  const inCaseDir = path.join(ctx.caseDir, fileName)
  if (fs.existsSync(inCaseDir)) {
    return fs.readFileSync(inCaseDir, 'utf-8')
  }
  throw new Error(
    `Input file not found for station ${ctx.caseName}: checked ${inInputDir} and ${inCaseDir}`
  )
}

export async function compileVirtualCase(ctx: StationContext): Promise<VirtualResult> {
  const caseConfigPath = path.join(ctx.caseDir, 'case.json')
  const config = JSON.parse(fs.readFileSync(caseConfigPath, 'utf-8')) as VirtualCaseConfig
  const sourceCode = readSourceCode(ctx, config)

  const startedAt = performance.now()
  const code = executeRewrite(sourceCode, config)
  const rustApiMs = performance.now() - startedAt

  return {
    code,
    metrics: {
      rustApiMs,
    },
  }
}
