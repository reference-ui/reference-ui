/**
 * Register a box pattern extension.
 *
 * Each prop file (container, font, r) calls this to contribute to the combined box.
 * At build time, the CLI collects these and emits the inlined box.ts.
 *
 * @example
 * ```ts
 * pattern({
 *   properties: { container: { type: 'string' } },
 *   transform(props) {
 *     const { container } = props
 *     return container !== undefined
 *       ? { containerType: 'inline-size', ...(container && { containerName: container }) }
 *       : {}
 *   }
 * })
 * ```
 */
export { extendBoxPattern as extendPattern } from '../../../cli/panda/boxPattern/extendBoxPattern'
