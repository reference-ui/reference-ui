import { css } from '@reference-ui/react'
import { brand } from './index'

// Two hops (index -> barrel -> tokens): resolves by merge.
css({ color: brand })
