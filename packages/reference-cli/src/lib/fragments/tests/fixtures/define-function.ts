/**
 * Example function that collects fragments.
 * In real usage, this would be exported from @reference-ui/system
 */

const COLLECTOR_KEY = '__myFunctionCollector'

export const myFunction = (obj: unknown) => {
  const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  if (Array.isArray(collector)) {
    collector.push(obj)
  }
}
