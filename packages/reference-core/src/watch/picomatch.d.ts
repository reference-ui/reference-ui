declare module 'picomatch' {
  function picomatch(glob: string | string[], options?: unknown): (path: string) => boolean
  export default picomatch
}
