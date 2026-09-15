/**
 * Host StyleProps station. Recipe classes sit in @layer recipes. mt/bg on
 * the host are utilities. variant stays runtime-owned (ATM-COND-06).
 */
import { expect } from 'vitest'
import { hasWant, layerBody, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-RECIPE-03',
  verify(result) {
    const sheet = result.stylesheet
    const recipesIdx = sheet.indexOf('@layer recipes {')
    const utilitiesIdx = sheet.indexOf('@layer utilities {')
    expect(recipesIdx).toBeGreaterThan(-1)
    expect(utilitiesIdx).toBeGreaterThan(recipesIdx)

    const recipes = layerBody(sheet, 'recipes')
    const utilities = layerBody(sheet, 'utilities')
    expect(recipes).toContain('.button {')
    expect(recipes).toContain('display: inline-flex')
    expect(recipes).toContain('.button--variant_primary')
    expect(recipes).toContain('color: white')
    expect(utilities).toContain('.mt_2r')
    expect(utilities).toContain('.bg_red\\.500')
    expect(utilities).not.toContain('.button {')
    expect(utilities).not.toContain('.button--')
    expect(utilities).not.toContain('variant')

    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'bg', 'red.500')).toBe(true)
    expect(hasWant(result, 'variant', 'primary')).toBe(true)
    expect(hasWant(result, 'display', 'inline-flex')).toBe(false)
    expect(hasWant(result, 'color', 'white')).toBe(false)
    expect(result.diagnostics).toHaveLength(0)
  },
}

export default spec
