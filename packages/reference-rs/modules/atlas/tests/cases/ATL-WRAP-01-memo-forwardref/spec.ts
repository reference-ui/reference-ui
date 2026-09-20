/**
 * Station specification for ATL-WRAP-01-memo-forwardref.
 * Validates component discovery, call-site counting, and interface mapping
 * for components wrapped in React.memo and React.forwardRef, including
 * direct default-exported wrapper calls (`export default memo(...)`).
 * Proves primary SPEC anchor ATL-WRAP-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-WRAP-01',
  verify(result) {
    const fancyButton = result.components.find(c => c.name === 'FancyButton')!
    expect(fancyButton).toBeDefined()
    expect(fancyButton.count).toBe(2)
    expect(fancyButton.interface?.name).toBe('FancyButtonProps')
    expect(fancyButton.examples[0]).toMatch(/<CTAButton/)

    const searchInput = result.components.find(c => c.name === 'SearchInput')!
    expect(searchInput).toBeDefined()
    expect(searchInput.count).toBe(2)
    expect(searchInput.interface?.name).toBe('SearchInputProps')
    expect(searchInput.examples[0]).toMatch(/<SearchBox/)

    const directMemo = result.components.find(c => c.name === 'DirectMemo')!
    expect(directMemo).toBeDefined()
    expect(directMemo.count).toBe(2)
    expect(directMemo.interface?.name).toBe('DirectMemoProps')
    expect(directMemo.examples[0]).toMatch(/<DirectMemo/)

    const directForwardRef = result.components.find(
      c => c.name === 'DirectForwardRef'
    )!
    expect(directForwardRef).toBeDefined()
    expect(directForwardRef.count).toBe(2)
    expect(directForwardRef.interface?.name).toBe('DirectForwardRefProps')
    expect(directForwardRef.examples[0]).toMatch(/<DirectRefBox/)
  },
}

export default spec
