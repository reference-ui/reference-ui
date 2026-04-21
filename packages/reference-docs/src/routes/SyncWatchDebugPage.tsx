import { Div, css } from '@reference-ui/react'

const probeClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '14rem',
  minHeight: '6rem',
  color: '#ffffff',
  backgroundColor: '#0070f3',
  padding: '1rem',
  borderRadius: '0.75rem',
})

export function SyncWatchDebugPage() {
  return (
    <Div display="flex" flexDirection="column" gap="6r">
      <Div>
        <Div fontSize="2xl" fontWeight="700" color="docsHeading" marginBottom="2r" bg="amber.200" padding="2r">
          Sync Watch Debug
        </Div>
        <Div color="docsMuted" maxWidth="70ch" lineHeight="1.6">
          This page mirrors the e2e sync-watch probe using a raw div with a class from css().
          Run the docs dev server, open this route, then edit this file and change the
          backgroundColor value to verify whether watch updates keep the generated utility.
        </Div>
      </Div>

      <Div
        background="docsDemoMutedBg"
        border="1px solid"
        borderColor="docsPanelBorder"
        borderRadius="xl"
        padding="8r"
      >
        <div data-testid="docs-sync-watch-probe" className={probeClass}>
          Docs sync-watch probe
        </div>
      </Div>

      <Div color="docsMuted" fontSize="sm">
        File to edit: packages/reference-docs/src/routes/SyncWatchDebugPage.tsx
      </Div>
    </Div>
  )
}