/**
 * Reference Lib - design system consumer.
 * Exports baseSystem for extends[] in downstream apps.
 *
 * Run `ref sync` in reference-lib before using.
 * Uses relative path to avoid resolution to wrong @reference-ui/system.
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { REF_LIB_CANARY } from './colors.js'
