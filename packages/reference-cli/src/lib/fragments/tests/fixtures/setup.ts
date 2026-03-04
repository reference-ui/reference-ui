import { createFragmentCollector } from '../../index'

export const myFunction = createFragmentCollector<Record<string, unknown>>({
  name: 'myFunction',
  targetFunction: 'myFunction',
})
