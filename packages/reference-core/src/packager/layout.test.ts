import { describe, expect, it } from 'vitest'
import { DEFAULT_OUT_DIR } from '../constants'
import {
  getShortName,
  getPackageDir,
  getEntryBasename,
  getDeclarationBasename,
  getRuntimeEntryPath,
} from './layout'

const OUT_DIR_RE = DEFAULT_OUT_DIR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('packager/layout', () => {
  describe('getShortName', () => {
    it('strips scope from scoped package name', () => {
      expect(getShortName('@reference-ui/react')).toBe('react')
      expect(getShortName('@reference-ui/system')).toBe('system')
      expect(getShortName('@reference-ui/types')).toBe('types')
      expect(getShortName('@reference-ui/styled')).toBe('styled')
    })

    it('returns name unchanged when no scope', () => {
      expect(getShortName('react')).toBe('react')
    })
  })

  describe('getPackageDir', () => {
    it('resolves package output dir under outDir', () => {
      const outDir = `/project/${DEFAULT_OUT_DIR}`
      expect(getPackageDir(outDir, '@reference-ui/react')).toMatch(
        new RegExp(`${OUT_DIR_RE}[/\\\\]react$`),
      )
      expect(getPackageDir(outDir, '@reference-ui/system')).toMatch(
        new RegExp(`${OUT_DIR_RE}[/\\\\]system$`),
      )
      expect(getPackageDir(outDir, '@reference-ui/types')).toMatch(
        new RegExp(`${OUT_DIR_RE}[/\\\\]types$`),
      )
    })
  })

  describe('getEntryBasename', () => {
    it('derives basename from main field', () => {
      expect(getEntryBasename({ main: './react.mjs' })).toBe('react.mjs')
      expect(getEntryBasename({ main: './system.mjs' })).toBe('system.mjs')
    })

    it('defaults to index.js when main is missing', () => {
      expect(getEntryBasename({})).toBe('index.js')
    })
  })

  describe('getDeclarationBasename', () => {
    it('replaces .mjs with .d.mts', () => {
      expect(getDeclarationBasename('react.mjs')).toBe('react.d.mts')
      expect(getDeclarationBasename('system.mjs')).toBe('system.d.mts')
    })

    it('replaces .js with .d.mts', () => {
      expect(getDeclarationBasename('index.js')).toBe('index.d.mts')
    })
  })

  describe('getRuntimeEntryPath', () => {
    it('returns full path to runtime entry under package dir', () => {
      const outDir = `/project/${DEFAULT_OUT_DIR}`
      expect(getRuntimeEntryPath(outDir, '@reference-ui/react', 'react.mjs')).toMatch(
        new RegExp(`${OUT_DIR_RE}[/\\\\]react[/\\\\]react\\.mjs$`),
      )
    })
  })
})
