/**
 * Examples using advanced template literals.
 */

import type {
  TemplateLiteralMapped,
  TemplateLiteralUnionExplosion,
  TemplateLiteralIntrinsic,
  GetterMapped,
  RoutePaths,
  CssClasses,
  EventNames,
  ApiEndpoints,
  User,
} from './template-types'

// Getter mapped example
export type GetterExample = {
  userGetters: GetterMapped
  callGetName: (getters: GetterMapped) => string
  callGetAge: (getters: GetterMapped) => number
}

// Route paths example
export type RouteExample = {
  paths: RoutePaths
  getUsersList: (path: '/users/list') => User[]
  getPostsDetail: (path: '/posts/detail') => Post
}

// CSS classes example
export type CssExample = {
  buttonClasses: CssClasses<{ primary: string; secondary: string; danger: string }>
  getPrimaryClass: (classes: CssClasses<{ primary: string }>) => string
}

// Event names example
export type EventExample = {
  events: EventNames[]
  clickHandler: (event: EventNames) => void
  hoverHandler: (event: EventNames) => void
}

// API endpoints example
export type ApiExample = {
  endpoints: ApiEndpoints
  callUsersApi: (endpoint: ApiEndpoints['api/users']) => User[]
  callPostsApi: (endpoint: ApiEndpoints['api/posts']) => Post[]
}

// Intrinsic functions example
export type IntrinsicExample = {
  intrinsics: TemplateLiteralIntrinsic
  uppercaseResult: TemplateLiteralIntrinsic['Uppercase']
  lowercaseResult: TemplateLiteralIntrinsic['Lowercase']
  capitalizeResult: TemplateLiteralIntrinsic['Capitalize']
  uncapitalizeResult: TemplateLiteralIntrinsic['Uncapitalize']
}

// Post interface for examples
interface Post {
  id: string
  title: string
  content: string
}
