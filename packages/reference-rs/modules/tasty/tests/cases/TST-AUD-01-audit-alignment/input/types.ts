export interface User {
  id: string;
}

/** Import types are intentionally preserved as raw summaries. */
export type RemoteWidget = import('./dep').Widget;

/** Conditional types stay structural even when nested infer remains raw. */
export type Flatten<T> = T extends Array<infer U> ? U : T;

/** Member using an import type should also stay raw. */
export interface WithImportMember {
  widget: import('./dep').Widget;
}

/** Function types are structured, but predicate returns remain raw summaries. */
export interface WithPredicate {
  isUser: (value: unknown) => value is User;
}

/** This types are intentionally preserved as raw summaries. */
export interface WithThisType {
  self: this;
}
