/**
 * Poison injection test suite for Canon fail-closed join validation.
 * Verifies that the compiler generator aborts on invalid tags, unallowlisted CSS properties,
 * drifted native shorthands, invalid aliases, invalid colors, and duplicate class prefixes.
 * Proves that join validation guards CAN-FAIL-04 through CAN-FAIL-08 fail closed under mutation.
 */

import { describe, expect, it } from 'vitest';

import { loadDialect, type DialectData } from './dialect';
import {
  validateAliasTargetsJoin,
  validateClassPrefixesJoin,
  validateColorPropsJoin,
  validateDialectExtJoin,
  validateElementsJoin,
  validateJoin,
  validateShorthandsJoin,
} from './join';
import { loadPlatformCss, loadPlatformElements } from './platform';

describe('Canon Join Validation (Fail-Closed Gates)', async () => {
  const platformElements = await loadPlatformElements();
  const platformCss = await loadPlatformCss();
  const baseDialect = loadDialect(platformCss);

  function cloneDialect(dialect: DialectData): DialectData {
    return {
      ...dialect,
      elements: dialect.elements.map((e) => ({ ...e })),
      primitiveJsx: [...dialect.primitiveJsx],
      canonicalProperties: dialect.canonicalProperties.map((p) => ({
        ...p,
        longhands: [...p.longhands],
      })),
      aliases: dialect.aliases.map((a) => ({ ...a })),
      referenceProps: [...dialect.referenceProps],
      conditions: [...dialect.conditions],
      breakpoints: [...dialect.breakpoints],
      colorProperties: [...dialect.colorProperties],
      dialectColorAllowlist: new Set(dialect.dialectColorAllowlist),
      dialectCssAllowlist: new Set(dialect.dialectCssAllowlist),
      dialectShortPrefixes: new Map(dialect.dialectShortPrefixes),
      dialectAliases: new Map(dialect.dialectAliases),
    };
  }

  it('passes join validation on the authoritative platform and dialect', () => {
    const errors = validateJoin(baseDialect, platformElements, platformCss);
    expect(errors).toEqual([]);
  });

  it('CAN-JOIN-08: asserts all canonical properties have unique class prefixes', () => {
    const errors = validateClassPrefixesJoin(baseDialect);
    expect(errors).toEqual([]);
  });

  it('CAN-FAIL-04: aborts when dialect contains unknown HTML/SVG element tag', () => {
    const poisoned = cloneDialect(baseDialect);
    poisoned.elements.push({ html: 'foobar', jsx: 'Foobar' });

    const errors = validateElementsJoin(poisoned, platformElements);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('foobar');
  });

  it('CAN-FAIL-05: aborts when dialect contains unverified CSS property', () => {
    const poisoned = cloneDialect(baseDialect);
    poisoned.canonicalProperties.push({
      name: 'foobarProp',
      css: 'foobar-prop',
      classPrefix: 'foobar-prop',
      longhands: [],
    });

    const errors = validateDialectExtJoin(poisoned, platformCss);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('foobarProp');
  });

  it('CAN-FAIL-06: aborts when native shorthand longhands disagree with @webref/css', () => {
    const poisoned = cloneDialect(baseDialect);
    const padding = poisoned.canonicalProperties.find((p) => p.name === 'padding');
    expect(padding).toBeDefined();
    padding!.longhands = ['paddingTop', 'paddingBottom']; // mutated, missing left and right

    const errors = validateShorthandsJoin(poisoned, platformCss);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('padding');
  });

  it('CAN-FAIL-07: aborts on unknown alias target or unverified color extension', () => {
    const poisonedAlias = cloneDialect(baseDialect);
    poisonedAlias.aliases.push({ alias: 'badAlias', canonical: 'unrecognizedTarget' });

    const aliasErrors = validateAliasTargetsJoin(poisonedAlias, platformCss);
    expect(aliasErrors.length).toBeGreaterThan(0);
    expect(aliasErrors[0]).toContain('badAlias');
    expect(aliasErrors[0]).toContain('unrecognizedTarget');

    const poisonedColor = cloneDialect(baseDialect);
    poisonedColor.colorProperties.push('unrecognizedColor');

    const colorErrors = validateColorPropsJoin(poisonedColor, platformCss);
    expect(colorErrors.length).toBeGreaterThan(0);
    expect(colorErrors[0]).toContain('unrecognizedColor');
  });

  it('CAN-FAIL-08: aborts when duplicate class_prefix is introduced', () => {
    const poisoned = cloneDialect(baseDialect);
    const display = poisoned.canonicalProperties.find((p) => p.name === 'display');
    const d = poisoned.canonicalProperties.find((p) => p.name === 'd');
    expect(display).toBeDefined();
    expect(d).toBeDefined();
    d!.classPrefix = 'd'; // collision with display

    const errors = validateClassPrefixesJoin(poisoned);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Duplicate class_prefix 'd'");
    expect(errors[0]).toContain('d');
    expect(errors[0]).toContain('display');
  });
});
