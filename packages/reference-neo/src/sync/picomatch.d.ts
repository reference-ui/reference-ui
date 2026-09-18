// Type seam for picomatch, which ships no TypeScript declarations of its
// own. It takes a glob or a list of globs and emits a matcher predicate
// over relative paths. One declaration, no runtime.
declare module 'picomatch' {
  function picomatch(glob: string | readonly string[], options?: unknown): (path: string) => boolean
  export default picomatch
}
