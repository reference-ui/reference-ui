import { css } from '@reference-ui/react'
import { brand, gap } from './barrel'

// One hop through the barrel: resolves to the origin value.
css({ color: brand })
css({ padding: gap })
