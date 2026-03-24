/**
 * Advanced template literal type definitions.
 */

// Template literal mapped type with getters
export type TemplateLiteralMapped<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]
}

// Template literal union explosion
export type TemplateLiteralUnionExplosion = `/${'users' | 'posts'}/${'list' | 'detail'}`

// Template literal with intrinsics
export type TemplateLiteralIntrinsic = {
  Uppercase: Uppercase<'hello'>
  Lowercase: Lowercase<'WORLD'>
  Capitalize: Capitalize<'name'>
  Uncapitalize: Uncapitalize<'Title'>
}

// Getter mapped type example
export interface User {
  name: string
  age: number
  email: string
}

export type GetterMapped = TemplateLiteralMapped<User>

// Route paths with union explosion
export type RoutePaths = TemplateLiteralUnionExplosion

// CSS classes with template literals
export type CssClasses<T> = {
  [K in keyof T as `btn-${K & string}`]: string
}

// Event names with template literals
export type EventNames = `on${Capitalize<'click' | 'hover' | 'focus'>}`

// API endpoints with template literals
export type ApiEndpoints = {
  [K in keyof ApiConfig as `api/${K & string}`]: ApiConfig[K]
}

interface ApiConfig {
  users: { get: () => User[]; post: (user: User) => User }
  posts: { get: () => Post[]; post: (post: Post) => Post }
}

interface Post {
  id: string
  title: string
  content: string
}
