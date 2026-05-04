import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..', '..')
const indexSourcePath = join(packageRoot, 'src', 'index.tsx')
const stylesSourcePath = join(packageRoot, 'src', 'styles.ts')
function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    })
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

async function loadRecipeStylesModule(versionTag: string) {
  const url = new URL(pathToFileURL(stylesSourcePath).href)
  url.searchParams.set('t', versionTag)
  return import(url.href)
}

describe('recipe rebuild output', () => {
  it(
    'keeps recipe classes stable across unrelated rebuilds and regenerates them when the recipe contract changes',
    async () => {
      const originalIndexSource = readFileSync(indexSourcePath, 'utf8')
      const originalStylesSource = readFileSync(stylesSourcePath, 'utf8')
      const headingText = 'Reference UI recipe matrix'
      const updatedHeadingText = 'Reference UI recipe matrix rebuild probe'
      const originalFontWeightLine = "        fontWeight: '500',"
      const updatedFontWeightLine = "        fontWeight: '550',"
      let testError: unknown

      expect(originalIndexSource).toContain(headingText)
      expect(originalStylesSource).toContain(originalFontWeightLine)

      try {
        runRefSync()

        const baselineModule = await loadRecipeStylesModule(`baseline-${Date.now()}`)
        const baselineOutlineClass = baselineModule.recipeMatrixButton({ visual: 'outline', tone: 'teal', size: 'sm' })
        const baselineCompoundClass = baselineModule.recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true })
        const baselineResponsiveClass = baselineModule.recipeMatrixResponsiveCard({ tone: 'alert' })

        writeFileSync(indexSourcePath, originalIndexSource.replace(headingText, updatedHeadingText))
        runRefSync()

        const unrelatedRebuildModule = await loadRecipeStylesModule(`unrelated-${Date.now()}`)
        const unrelatedOutlineClass = unrelatedRebuildModule.recipeMatrixButton({ visual: 'outline', tone: 'teal', size: 'sm' })
        const unrelatedCompoundClass = unrelatedRebuildModule.recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true })
        const unrelatedResponsiveClass = unrelatedRebuildModule.recipeMatrixResponsiveCard({ tone: 'alert' })

        expect(unrelatedOutlineClass).toBe(baselineOutlineClass)
        expect(unrelatedCompoundClass).toBe(baselineCompoundClass)
        expect(unrelatedResponsiveClass).toBe(baselineResponsiveClass)

        writeFileSync(stylesSourcePath, originalStylesSource.replace(originalFontWeightLine, updatedFontWeightLine))
        runRefSync()

        const recipeChangeModule = await loadRecipeStylesModule(`recipe-change-${Date.now()}`)
        const updatedOutlineClass = recipeChangeModule.recipeMatrixButton({ visual: 'outline', tone: 'teal', size: 'sm' })
        const updatedCompoundClass = recipeChangeModule.recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true })
        const unchangedResponsiveClass = recipeChangeModule.recipeMatrixResponsiveCard({ tone: 'alert' })

        expect(updatedOutlineClass).not.toBe(baselineOutlineClass)
        expect(updatedCompoundClass).toBe(baselineCompoundClass)
        expect(unchangedResponsiveClass).toBe(baselineResponsiveClass)
      } catch (error) {
        testError = error
        throw error
      } finally {
        let cleanupError: unknown

        try {
          if (readFileSync(indexSourcePath, 'utf8') !== originalIndexSource) {
            writeFileSync(indexSourcePath, originalIndexSource)
          }

          if (readFileSync(stylesSourcePath, 'utf8') !== originalStylesSource) {
            writeFileSync(stylesSourcePath, originalStylesSource)
          }

          runRefSync()
        } catch (error) {
          cleanupError = error
        }

        if (!testError && cleanupError) {
          throw cleanupError
        }
      }
    },
    120_000,
  )
})