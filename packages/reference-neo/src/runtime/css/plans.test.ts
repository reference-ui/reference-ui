// Unit tests for the Neo plan index over hand-built artifacts.
// They take lookup queries and assert canonical keys plus merged classes.
// Key serialization must match the native engine exactly or nothing resolves.

import { describe, expect, it } from 'vitest'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import {
  createStylePlanIndex,
  findStylePlanMisses,
  mergeStylePlans,
  resolveStyleDeclarations,
  serializeCanonicalJson,
  serializeLookupKey,
} from './plans.ts'

describe('serializeCanonicalJson', () => {
  it('serializes scalars like the native engine', () => {
    expect(serializeCanonicalJson(null)).toBe('null')
    expect(serializeCanonicalJson(0.5)).toBe('0.5')
    expect(serializeCanonicalJson(Number.NaN)).toBe('null')
    expect(serializeCanonicalJson(Number.POSITIVE_INFINITY)).toBe('null')
    expect(serializeCanonicalJson(true)).toBe('true')
    expect(serializeCanonicalJson('blue.500')).toBe('"blue.500"')
    expect(serializeCanonicalJson(undefined)).toBe('null')
  })

  it('sorts object keys recursively', () => {
    expect(serializeCanonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}'
    )
  })

  it('keeps array order', () => {
    expect(serializeCanonicalJson(['blue.500', 'red.500'])).toBe('["blue.500","red.500"]')
  })
})

describe('serializeLookupKey', () => {
  it('emits the five-tuple in compact JSON', () => {
    expect(serializeLookupKey('sys', ['_hover'], 'color', 'brand', true)).toBe(
      '["sys",["_hover"],"color","brand",true]'
    )
  })

  it('defaults the important flag to false', () => {
    expect(serializeLookupKey('sys', [], 'p', '2')).toBe('["sys",[],"p","2",false]')
  })
})

const ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_brand' }],
    },
    {
      system: 'test',
      when: ['_hover'],
      prop: 'color',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'hover:color', className: 'test__hover:c_brand' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'size',
      value: '2',
      important: false,
      declarations: [
        { slot: 'width', className: 'test__w_2' },
        { slot: 'height', className: 'test__h_2' },
      ],
    },
  ],
  recipes: {},
  stylePropNames: ['color', 'size'],
}

describe('style plan index', () => {
  it('resolves hits and omits misses', () => {
    const index = createStylePlanIndex(ARTIFACT)

    expect(
      resolveStyleDeclarations(index, [
        { system: 'test', prop: 'color', value: 'brand' },
        { system: 'test', prop: 'color', value: 'nope' },
      ])
    ).toEqual([{ slot: 'color', className: 'test__c_brand' }])
  })

  it('keeps whens and systems apart', () => {
    const index = createStylePlanIndex(ARTIFACT)

    expect(
      resolveStyleDeclarations(index, [
        { system: 'test', when: ['_hover'], prop: 'color', value: 'brand' },
        { system: 'other', prop: 'color', value: 'brand' },
      ])
    ).toEqual([{ slot: 'hover:color', className: 'test__hover:c_brand' }])
  })

  it('merges multi-declaration plans and collapses slots last-wins', () => {
    const index = createStylePlanIndex(ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'brand' },
        { system: 'test', prop: 'size', value: '2' },
        { system: 'test', when: ['_hover'], prop: 'color', value: 'brand' },
        { system: 'test', prop: 'color', value: 'brand' },
      ])
    ).toBe('test__c_brand test__w_2 test__h_2 test__hover:c_brand')
  })
})

const IMPORTANT_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'ember',
      important: true,
      declarations: [{ slot: 'color', className: 'test__c_ember!' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'ocean',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_ocean' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'ink',
      important: true,
      declarations: [{ slot: 'color', className: 'test__c_ink!' }],
    },
  ],
  recipes: {},
  stylePropNames: ['color'],
}

describe('important merge', () => {
  it('lets an earlier important atom beat a later plain atom', () => {
    const index = createStylePlanIndex(IMPORTANT_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'ember', important: true },
        { system: 'test', prop: 'color', value: 'ocean' },
      ])
    ).toBe('test__c_ember!')
  })

  it('lets a later important atom beat an earlier plain atom', () => {
    const index = createStylePlanIndex(IMPORTANT_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'ocean' },
        { system: 'test', prop: 'color', value: 'ember', important: true },
      ])
    ).toBe('test__c_ember!')
  })

  it('collapses two important atoms last-wins', () => {
    const index = createStylePlanIndex(IMPORTANT_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'ember', important: true },
        { system: 'test', prop: 'color', value: 'ink', important: true },
      ])
    ).toBe('test__c_ink!')
  })
})

const RESPONSIVE_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: ['50px', '60px'],
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_50px' },
        { slot: 'width@sm', className: 'test__sm:w_60px' },
      ],
    },
    {
      system: 'test',
      when: [],
      prop: 'width',
      value: ['70px', '80px'],
      important: false,
      declarations: [
        { slot: 'width@base', className: 'test__w_70px' },
        { slot: 'width@sm', className: 'test__sm:w_80px' },
      ],
    },
  ],
  recipes: {},
  stylePropNames: ['width'],
}

describe('responsive merge', () => {
  it('collapses a later responsive array last-wins per breakpoint slot', () => {
    const index = createStylePlanIndex(RESPONSIVE_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'width', value: ['50px', '60px'] },
        { system: 'test', prop: 'width', value: ['70px', '80px'] },
      ])
    ).toBe('test__w_70px test__sm:w_80px')
  })
})

const ORDER_ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 1,
  stylePlans: [
    {
      system: 'test',
      when: [],
      prop: 'color',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'color', className: 'test__c_brand' }],
    },
    {
      system: 'test',
      when: ['@container (min-width: 320px)'],
      prop: 'color',
      value: 'paper',
      important: false,
      declarations: [{ slot: '@container (min-width: 320px):color', className: 'test__cq:c_paper' }],
    },
    {
      system: 'test',
      when: ['_dark'],
      prop: 'color',
      value: 'paper',
      important: false,
      declarations: [{ slot: 'dark:color', className: 'test__dark:c_paper' }],
    },
    {
      system: 'test',
      when: [],
      prop: 'outlineColor',
      value: 'brand',
      important: false,
      declarations: [{ slot: 'outlineColor', className: 'test__c_brand' }],
    },
  ],
  recipes: {},
  stylePropNames: ['color', 'outlineColor'],
}

describe('condition order and duplicates', () => {
  it('emits base, container, and theme classes in author order', () => {
    const index = createStylePlanIndex(ORDER_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'brand' },
        { system: 'test', when: ['@container (min-width: 320px)'], prop: 'color', value: 'paper' },
        { system: 'test', when: ['_dark'], prop: 'color', value: 'paper' },
      ])
    ).toBe('test__c_brand test__cq:c_paper test__dark:c_paper')
    expect(
      mergeStylePlans(index, [
        { system: 'test', when: ['_dark'], prop: 'color', value: 'paper' },
        { system: 'test', prop: 'color', value: 'brand' },
      ])
    ).toBe('test__dark:c_paper test__c_brand')
  })

  it('prints a class shared across slots once', () => {
    const index = createStylePlanIndex(ORDER_ARTIFACT)

    expect(
      mergeStylePlans(index, [
        { system: 'test', prop: 'color', value: 'brand' },
        { system: 'test', prop: 'outlineColor', value: 'brand' },
      ])
    ).toBe('test__c_brand')
  })
})

describe('findStylePlanMisses', () => {
  it('returns only the queries no plan matches', () => {
    const index = createStylePlanIndex(ARTIFACT)

    expect(
      findStylePlanMisses(index, [
        { system: 'test', prop: 'color', value: 'brand' },
        { system: 'test', prop: 'color', value: 'nope' },
        { system: 'test', when: ['_hover'], prop: 'color', value: 'brand' },
        { system: 'test', when: ['_dark'], prop: 'color', value: 'brand' },
      ])
    ).toEqual([
      { system: 'test', prop: 'color', value: 'nope' },
      { system: 'test', when: ['_dark'], prop: 'color', value: 'brand' },
    ])
  })
})
