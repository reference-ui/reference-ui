/**
 * Use sites for ATM-SITE-103: `Heart` from `lucide-react`, an installed package
 * not built on Reference UI, and `Sparkline` from `chart-kit`, which nothing
 * installs, both carry props whose names are style props. Reference's own
 * `Div` is the control that paints.
 */
import { Div } from '@reference-ui/react'
import { Heart } from 'lucide-react'
import { Sparkline } from 'chart-kit'

export function App() {
  return (
    <Div p="1r">
      <Heart color="red" size={16} />
      <Sparkline color="blue" p="2r" />
    </Div>
  )
}
