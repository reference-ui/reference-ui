import type * as esbuild from 'esbuild'

const REACT_STUB_CONTENTS = `
const noop = () => proxy;
const proxy = new Proxy(noop, {
  get: () => proxy,
  apply: () => proxy,
});
export default proxy;
export const createElement = proxy;
export const jsx = proxy;
export const jsxs = proxy;
export const Fragment = proxy;
export const useState = () => [undefined, noop];
export const useEffect = noop;
export const useLayoutEffect = noop;
export const useMemo = (fn) => (typeof fn === 'function' ? fn() : undefined);
export const useCallback = (fn) => fn;
export const useRef = () => ({ current: null });
export const useContext = () => ({});
export const createContext = () => proxy;
export const forwardRef = (fn) => fn;
export const memo = (fn) => fn;
export const Children = proxy;
export const version = '0.0.0-stub';
`

/**
 * esbuild plugin that intercepts React and ReactDOM imports during build-time
 * fragment bundling and replaces them with a zero-runtime proxy stub.
 *
 * This guarantees:
 * 1. Zero bytes of React runtime in fragment IIFEs (saving ~100-435 KB per file).
 * 2. Node ESM eval never crashes with "Dynamic require of 'react' is not supported".
 * 3. Component JSX and hooks can coexist in fragment/theme files without leaking into build RSS.
 */
export function reactStubPlugin(): esbuild.Plugin {
  return {
    name: 'react-stub',
    setup(build) {
      const filter = /^(react|react-dom|react\/jsx-runtime|react\/jsx-dev-runtime)(?:[/\\].*)?$/
      build.onResolve({ filter }, (args) => ({
        path: args.path,
        namespace: 'react-stub',
      }))
      build.onLoad({ filter: /.*/, namespace: 'react-stub' }, () => ({
        contents: REACT_STUB_CONTENTS,
        loader: 'js',
      }))
    },
  }
}
