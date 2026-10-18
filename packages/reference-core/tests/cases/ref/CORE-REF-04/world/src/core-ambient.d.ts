// Ambient generated-package declarations: they type the imports that resolve only after sync runs.
// The package typecheck runs before any world syncs, so these modules would otherwise fail fresh trees.
// Tasty and the bundlers resolve the same specifiers through the linked packages at build time instead.
declare module '@reference-ui/styled/types' {
  export type SystemStyleObject = Record<string, unknown>
}
