import { css } from '@reference-ui/react'

export function App() {
  const c1 = css({
    '&:last-child': {
      '& .divider': { display: 'none' },
    },
  })
  const c2 = css({
    '&:not(:first-child), &:only-child': { mt: '0' },
  })
  const c3 = css({
    '&[data-x="a & b"]': { color: 'blue.600' },
  })
  return <div className={`${c1} ${c2} ${c3}`} />
}
