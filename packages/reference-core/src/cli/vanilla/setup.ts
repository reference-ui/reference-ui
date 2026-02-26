/**
 * Create a Vanilla Extract benchmark project.
 * Minimal mode: 2 files. Stress mode: many files with many styles.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { log } from '../lib/log'

export interface BenchmarkOptions {
  /** Number of style files (0 = minimal) */
  stressFiles?: number
  /** Styles per file in stress mode */
  stressStylesPerFile?: number
}

const THEME_CSS_TS = `import { createTheme } from '@vanilla-extract/css'

export const [themeClass, vars] = createTheme({
  color: {
    text: '#333',
    background: '#fff',
    primary: '#0066cc',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
  },
  space: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  font: {
    sans: 'system-ui, sans-serif',
    mono: 'monospace',
  },
})
`

function generateStyleFile(_moduleId: number, styleCount: number): string {
  const imports = [
    "import { style, styleVariants } from '@vanilla-extract/css'",
    "import { vars } from '../theme.css'",
  ]
  const styles: string[] = []
  for (let i = 0; i < styleCount; i++) {
    if (i % 5 === 0) {
      styles.push(`export const variant_${i} = styleVariants({
  default: { background: vars.color.primary, color: 'white' },
  secondary: { background: vars.color.secondary },
  outline: { border: '2px solid', borderColor: vars.color.primary },
})`)
    } else {
      styles.push(`export const block_${i} = style({
  display: 'flex',
  padding: vars.space.md,
  margin: vars.space.sm,
  fontSize: '0.875rem',
  fontFamily: vars.font.sans,
  selectors: {
    '&:hover': { opacity: 0.9 },
    '&:nth-child(2n)': { background: vars.color.background },
  },
  '@media': {
    'screen and (min-width: 768px)': { flexDirection: 'row' },
  },
})`)
    }
  }
  return imports.join('\n') + '\n\n' + styles.join('\n\n')
}

export interface BenchmarkResult {
  fileCount: number
  themeFile?: boolean
  componentFiles: number
  entryFile: boolean
  totalStyles: number
}

/**
 * Write VE benchmark project to benchDir.
 * Stress mode generates many .css.ts files with many styles each.
 */
export async function createBenchmarkProject(
  benchDir: string,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const { stressFiles = 0, stressStylesPerFile = 20 } = options

  await mkdir(benchDir, { recursive: true })

  if (stressFiles <= 0) {
    await writeFile(
      resolve(benchDir, 'app.css.ts'),
      `import { style } from '@vanilla-extract/css'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '1rem',
  color: 'var(--color-text)',
})

export const heading = style({
  fontSize: '1.5rem',
  fontWeight: 600,
})`,
      'utf-8'
    )
    await writeFile(
      resolve(benchDir, 'entry.ts'),
      `import './app.css.ts'
export {}`,
      'utf-8'
    )
    return {
      fileCount: 2,
      componentFiles: 0,
      entryFile: true,
      totalStyles: 2,
    }
  } else {
    await mkdir(resolve(benchDir, 'components'), { recursive: true })
    await writeFile(resolve(benchDir, 'theme.css.ts'), THEME_CSS_TS, 'utf-8')

    const imports: string[] = ["import './theme.css'"]
    for (let i = 0; i < stressFiles; i++) {
      const content = generateStyleFile(i, stressStylesPerFile)
      await writeFile(resolve(benchDir, 'components', `block_${i}.css.ts`), content, 'utf-8')
      imports.push(`import './components/block_${i}.css'`)
    }

    await writeFile(
      resolve(benchDir, 'entry.ts'),
      imports.join('\n') + '\n\nexport {}',
      'utf-8'
    )
  }

  const totalStyles = stressFiles * stressStylesPerFile
  log.debug(
    'vanilla:setup',
    stressFiles > 0
      ? `Created stress benchmark: ${stressFiles + 2} files, ${totalStyles} styles`
      : `Created minimal benchmark in ${benchDir}`
  )
  return {
    fileCount: stressFiles + 2,
    themeFile: true,
    componentFiles: stressFiles,
    entryFile: true,
    totalStyles,
  }
}
