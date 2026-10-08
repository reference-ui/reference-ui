import { css } from '@reference-ui/styled'

css({ color: dark ? 'red' : maybeFn() })
css({ color: dark ? maybeFn() : 'black' })
