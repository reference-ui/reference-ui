import '@reference-ui/react/styles.css'
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

createRoot(document.getElementById('root')!).render(
  <Div data-testid="sync-probe" padding="7.25r">Static synced padding</Div>,
)
