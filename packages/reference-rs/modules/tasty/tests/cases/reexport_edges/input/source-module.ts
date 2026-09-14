/**
 * Re-export pattern definitions and examples.
 */

// Source module for testing various re-export patterns
export interface Foo {
  foo: string
}

export const Bar = { bar: 42 }

export default { default: 'value' }

// Type module
export interface TypeA {
  a: string
}

export interface TypeB {
  b: number
}

// Namespace module
export const NSValue = 'namespace'
export interface NSType {
  ns: string
}
