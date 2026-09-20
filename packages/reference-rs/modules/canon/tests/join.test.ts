/**
 * Join validation and poison injection test suite for Canon fail-closed web standards verification.
 * Verifies that the live dialect satisfies all platform contracts across elements, CSS properties,
 * shorthands, aliases, class prefixes, short prefixes, and color extensions.
 * Proves that join validation guards abort under mutation for invalid tags, unverified properties,
 * drifted shorthands, unknown aliases, prefix collisions, and unauthorized colors.
 */

import { describe, expect, it } from 'vitest'

import { loadDialect, type DialectData } from '../generate/dialect'
import {
  validateAliasTargetsJoin,
  validateClassPrefixesJoin,
  validateColorPropsJoin,
  validateDialectExtJoin,
  validateElementsJoin,
  validateJoin,
  validateShorthandsJoin,
  validateShortPrefixesJoin,
} from '../generate/join'
import { SHORT_PREFIXES } from '../generate/overlay'
import { loadPlatformCss, loadPlatformElements } from '../generate/platform'

describe('Canon Join Validation (Fail-Closed Gates)', async () => {
  const platformElements = await loadPlatformElements()
  const platformCss = await loadPlatformCss()
  const baseDialect = loadDialect(platformCss)

  function cloneDialect(dialect: DialectData): DialectData {
    return {
      ...dialect,
      elements: dialect.elements.map(e => ({ ...e })),
      primitiveJsx: [...dialect.primitiveJsx],
      canonicalProperties: dialect.canonicalProperties.map(p => ({
        ...p,
        longhands: [...p.longhands],
      })),
      aliases: dialect.aliases.map(a => ({ ...a })),
      referenceProps: [...dialect.referenceProps],
      conditions: [...dialect.conditions],
      colorProperties: [...dialect.colorProperties],
      unitlessProperties: [...dialect.unitlessProperties],
      extensions: dialect.extensions,
    }
  }

  it('passes join validation on the authoritative platform and dialect', () => {
    const errors = validateJoin(baseDialect, platformElements, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-01: dialect JSX primitives join @webref/elements', () => {
    const errors = validateElementsJoin(baseDialect, platformElements)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-02: full platform CSS emission plus allowlisted dialect extensions', () => {
    const errors = validateDialectExtJoin(baseDialect, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-03: native CSS shorthands decompose to identical longhands as @webref/css', () => {
    const errors = validateShorthandsJoin(baseDialect, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-05: dialect alias targets resolve to platform properties or dialect extensions', () => {
    const errors = validateAliasTargetsJoin(baseDialect, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-06: dialect short-prefix properties exist on platform or dialect allowlist', () => {
    const errors = validateShortPrefixesJoin(baseDialect, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-07: dialect color extensions exist on explicit color allowlist', () => {
    const errors = validateColorPropsJoin(baseDialect, platformCss)
    expect(errors).toEqual([])
  })

  it('CAN-JOIN-08: asserts all canonical properties have unique class prefixes', () => {
    const errors = validateClassPrefixesJoin(baseDialect)
    expect(errors).toEqual([])
  })

  it('CAN-FAIL-04: aborts when dialect contains unknown HTML/SVG element tag', () => {
    const poisoned = cloneDialect(baseDialect)
    poisoned.elements.push({ html: 'foobar', jsx: 'Foobar' })

    const errors = validateElementsJoin(poisoned, platformElements)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('foobar')
  })

  it('CAN-FAIL-05: aborts when dialect contains unverified CSS property', () => {
    const poisoned = cloneDialect(baseDialect)
    poisoned.canonicalProperties.push({
      name: 'foobarProp',
      css: 'foobar-prop',
      classPrefix: 'foobar-prop',
      longhands: [],
    })

    const errors = validateDialectExtJoin(poisoned, platformCss)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('foobarProp')

    // Borrowed-css shape: a hallucinated name riding a legit css form must
    // still abort — the css field is an emission form, not an identity witness.
    const borrowedCss = cloneDialect(baseDialect)
    borrowedCss.canonicalProperties.push({
      name: 'foobarProp',
      css: 'color',
      classPrefix: 'fb',
      longhands: [],
    })

    const borrowedErrors = validateDialectExtJoin(borrowedCss, platformCss)
    expect(borrowedErrors.length).toBeGreaterThan(0)
    expect(borrowedErrors[0]).toContain('foobarProp')
  })

  it('CAN-FAIL-06: aborts when native shorthand longhands disagree with @webref/css', () => {
    const poisoned = cloneDialect(baseDialect)
    const padding = poisoned.canonicalProperties.find(p => p.name === 'padding')
    expect(padding).toBeDefined()
    padding!.longhands = ['paddingTop', 'paddingBottom'] // mutated, missing left and right

    const errors = validateShorthandsJoin(poisoned, platformCss)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('padding')
  })

  it('CAN-FAIL-07: aborts on unknown dialect alias targets', () => {
    const poisoned = cloneDialect(baseDialect)
    poisoned.aliases.push({ alias: 'badAlias', canonical: 'unrecognizedTarget' })

    const errors = validateAliasTargetsJoin(poisoned, platformCss)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('badAlias')
    expect(errors[0]).toContain('unrecognizedTarget')
  })

  it('CAN-FAIL-08: aborts when duplicate class_prefix is introduced', () => {
    const poisoned = cloneDialect(baseDialect)
    const display = poisoned.canonicalProperties.find(p => p.name === 'display')
    const d = poisoned.canonicalProperties.find(p => p.name === 'd')
    expect(display).toBeDefined()
    expect(d).toBeDefined()
    d!.classPrefix = 'd' // collision with display

    const errors = validateClassPrefixesJoin(poisoned)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain("Duplicate class_prefix 'd'")
    expect(errors[0]).toContain('d')
    expect(errors[0]).toContain('display')
  })

  it('CAN-FAIL-09: aborts when dialect short prefix property is not on platform or allowlist', () => {
    const poisonedPrefixes = { ...SHORT_PREFIXES, foobarProp: 'fb' }
    const errors = validateShortPrefixesJoin(platformCss, poisonedPrefixes)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('foobarProp')
  })

  it('CAN-FAIL-10: aborts when color extension is not in webref or dialect color allowlist', () => {
    const poisoned = cloneDialect(baseDialect)
    poisoned.colorProperties.push('unrecognizedColor')
    const errors = validateColorPropsJoin(poisoned, platformCss)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('unrecognizedColor')
  })
})
