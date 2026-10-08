import { css } from '@reference-ui/react'
import { brand } from './third'

// Three hops (third -> index -> barrel -> tokens): resolves by merge.
css({ color: brand })
