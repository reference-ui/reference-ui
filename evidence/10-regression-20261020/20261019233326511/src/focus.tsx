import '@reference-ui/react/styles.css'
import { createRoot } from 'react-dom/client'
import { Popover } from '@reference-ui/lib'

createRoot(document.getElementById('root')!).render(
  <main style={{ padding: 32, fontFamily: 'system-ui' }}>
    <h1>Popover focus restoration reproduction</h1>
    <p>Open the popover, Tab into its inputs, then press Escape or activate Close.</p>
    <Popover>
      <Popover.Trigger id="repro-trigger">Open form</Popover.Trigger>
      <Popover.Content
        aria-label="Example form"
        restoreFocus={true}
        style={{ background: 'white', border: '1px solid #aaa', padding: 24 }}
      >
        <label>First name <input id="first-name" /></label>
        <label>Last name <input id="last-name" /></label>
        <Popover.Close id="repro-close">Close form</Popover.Close>
      </Popover.Content>
    </Popover>
    <button id="after-popover">After popover</button>
  </main>,
)
