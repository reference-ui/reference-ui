import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileSync } from '@reference-ui/rust/system'
import { postprocessCss } from './postprocess'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = join(tmpdir(), `ref-core-native-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  mkdirSync(dir, { recursive: true })
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/stylesheet native engine integration', () => {
  it('compiles style props via native compileSync and integrates with postprocessCss', () => {
    const outDir = createTempDir()
    const styledDir = join(outDir, 'styled')
    mkdirSync(styledDir, { recursive: true })

    // 1. Establish Panda baseline layers and base reset
    const globalCssContent = [
      '@layer reset, base, tokens, recipes, utilities;',
      '@layer base {',
      '  :root { --colors-blue-500: #3b82f6; --spacing-root: 0.25rem; }',
      '}',
    ].join('\n')
    writeFileSync(join(styledDir, 'global.css'), globalCssContent, 'utf-8')

    // 2. Run native compiler over TSX source containing Reference UI style props
    const nativeResult = compileSync({
      files: [
        {
          path: 'Component.tsx',
          content: `
            import { Div, Span } from '@reference-ui/react';
            export const Card = ({ isSelected }: { isSelected: boolean }) => (
              <Div
                p="4r"
                bg="blue.500"
                borderBottom={isSelected ? "3px solid" : undefined}
              >
                <Span color="blue.500">Hello</Span>
              </Div>
            );
          `,
        },
      ],
    })

    expect(nativeResult.stylesheet).toContain('@layer utilities')
    expect(nativeResult.stylesheet).toContain('.bg_blue\\.500')
    expect(nativeResult.stylesheet).toContain('.p_4r')

    // 3. Combine baseline CSS with native utility rules into styles.css
    const combinedStyles = `${globalCssContent}\n${nativeResult.stylesheet}`
    writeFileSync(join(styledDir, 'styles.css'), combinedStyles, 'utf-8')

    // 4. Run reference-core's postprocessor
    const processedCss = postprocessCss(outDir, { name: 'test-system' })

    expect(processedCss).toBeDefined()
    expect(existsSync(join(styledDir, 'styles.css'))).toBe(true)

    const finalDiskCss = readFileSync(join(styledDir, 'styles.css'), 'utf-8')
    // Verify layers and rules are intact after core pipeline postprocessing
    expect(finalDiskCss).toContain('@layer')
    expect(finalDiskCss).toContain('.bg_blue')
    expect(finalDiskCss).toContain('.p_4r')
  })
})
