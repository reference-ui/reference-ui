// Entry for the NEO-SITE-11 world. It takes the configured Chart host and
// emits one padded chart, the shape a system extends its host list for.
import { createRoot } from '@reference-ui/react'
import { Chart } from './Chart.js'

export function Site() {
  return <Chart p="1r" id="chart" />
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Site />)
