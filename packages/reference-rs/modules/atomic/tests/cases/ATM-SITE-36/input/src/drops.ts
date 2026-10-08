import { css } from '@reference-ui/react'
import * as panda from '@reference-ui/react'

export const control = css({ color: 'red', padding: '4px' })

{
  const css = (styles: Record<string, string>) => styles
  css({ color: 'blue' })
}

panda({ color: 'green' })
panda.somethingElse({ color: 'purple' })
