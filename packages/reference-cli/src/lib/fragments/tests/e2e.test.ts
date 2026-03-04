/**
 * E2E Tests for Fragment Collection System
 * 
 * GOAL: Test the complete fragment collection flow as users would experience it
 * 
 * ## What We're Testing
 * 
 * 1. **Fragment Function Creation**
 *    - Library creates collector functions via createFragmentCollector()
 *    - Example: `export const tokens = createFragmentCollector({ name: 'tokens', targetFunction: 'tokens' })`
 *    - The returned function is callable AND has metadata/methods attached
 * 
 * 2. **User Code Pattern**
 *    - Users import the collector function from the library
 *    - Example: `import { tokens } from '@reference-ui/system'`
 *    - Users call it with their data: `tokens({ colors: { primary: '#000' } })`
 *    - The function call should push the data to globalThis
 * 
 * 3. **CLI Collection Flow**
 *    - CLI scans user files for function calls (e.g., files calling `tokens()`)
 *    - For each file:
 *      a. CLI calls collector.init() to set up globalThis array
 *      b. CLI bundles the file (with its imports) using microBundle
 *      c. CLI imports the bundled file (executes user code)
 *      d. User's function call pushes data to globalThis
 *      e. CLI calls collector.getFragments() to retrieve data
 *      f. CLI calls collector.cleanup() to remove from globalThis
 *    - Returns all collected fragments
 * 
 * 4. **Multiple Collectors (Planner API)**
 *    - CLI can collect from multiple fragment types in one pass
 *    - Example: collect both `tokens()` and `recipe()` fragments
 *    - Uses glob patterns from config.include
 *    - Returns keyed object: { tokens: [...], recipe: [...] }
 * 
 * ## Key Testing Challenges
 * 
 * - **Import Resolution**: User files import from './setup', which imports createFragmentCollector
 *   When bundled, these imports must resolve correctly
 * 
 * - **GlobalThis Isolation**: Each collector must use a unique globalKey
 *   Multiple collectors shouldn't interfere with each other
 * 
 * - **Realistic Simulation**: Tests should mimic real usage:
 *   - Library package exports collector functions
 *   - User code imports and calls them
 *   - CLI bundles and executes user code
 * 
 * ## Current Blockers
 * 
 * - The fixtures/setup.ts imports from '../../index' which doesn't resolve when copied to test directory
 * - Need to either:
 *   a. Make fixtures self-contained (no imports)
 *   b. Configure esbuild to resolve the imports
 *   c. Create setup.ts dynamically in the test with the correct globalKey
 * 
 * ## What Success Looks Like
 * 
 * ```ts
 * // Test creates collector
 * const tokens = createFragmentCollector({ name: 'tokens', targetFunction: 'tokens' })
 * 
 * // User file calls it (after being bundled and imported)
 * tokens({ colors: { primary: '#000' } })
 * 
 * // CLI collects
 * const fragments = await collectFragments({ files: [...], collector: tokens })
 * 
 * // Result
 * expect(fragments).toEqual([{ colors: { primary: '#000' } }])
 * ```
 */

// TODO: Implement actual tests once we figure out the import resolution strategy
