/**
 * ⚠️ THIS IS A SPEC FOR THE FINAL API - DO NOT MODIFY ⚠️
 * 
 * This file demonstrates how users will create and export fragment collectors.
 * AI should NEVER change this file - only implement the API to match this spec.
 * 
 * The collector function is callable: myFunction({ ... }) pushes fragments to globalThis.
 * The CLI will bundle user files that import and call this function.
 */
import { createFragmentCollector } from '../../index'

export const myFunction = createFragmentCollector<Record<string, unknown>>({
  name: 'myFunction',
  targetFunction: 'myFunction',
})

