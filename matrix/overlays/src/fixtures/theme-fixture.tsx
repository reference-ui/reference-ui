import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Overlay } from '@reference-ui/lib'

export function ThemeFixture() {
  const [darkOpen, setDarkOpen] = React.useState(false)
  const [lightOpen, setLightOpen] = React.useState(false)

  return (
    <div data-testid="theme-fixture-root" style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h2>Themed Portal Scope Fixtures</h2>

      <div style={{ display: 'flex', gap: 64 }}>
        {/* Dark mode section */}
        <section data-testid="section-dark-theme">
          <Div colorMode="dark" bg="gray.950" p="4" borderRadius="md">
            <Overlay open={darkOpen} onOpenChange={setDarkOpen} isolation={false}>
              <Overlay.Trigger data-testid="btn-open-dark-theme">
                Open Dark Popover
              </Overlay.Trigger>
              <Overlay.Content
                data-testid="content-dark-theme"
                placement="bottom-start"
                offset={8}
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
                border="1px solid"
                borderColor="ui.dialog.border"
                borderRadius="md"
                p="3r"
                minW="24r"
                zIndex={20}
              >
                <div>Dark themed popover body</div>
                <button
                  type="button"
                  data-testid="btn-close-dark-theme"
                  style={{ marginTop: 8 }}
                  onClick={() => setDarkOpen(false)}
                >
                  Close Dark
                </button>
              </Overlay.Content>
            </Overlay>
          </Div>
        </section>

        {/* Light mode section */}
        <section data-testid="section-light-theme">
          <Div colorMode="light" bg="gray.50" p="4" borderRadius="md">
            <Overlay open={lightOpen} onOpenChange={setLightOpen} isolation={false}>
              <Overlay.Trigger data-testid="btn-open-light-theme">
                Open Light Popover
              </Overlay.Trigger>
              <Overlay.Content
                data-testid="content-light-theme"
                placement="bottom-start"
                offset={8}
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
                border="1px solid"
                borderColor="ui.dialog.border"
                borderRadius="md"
                p="3r"
                minW="24r"
                zIndex={20}
              >
                <div>Light themed popover body</div>
                <button
                  type="button"
                  data-testid="btn-close-light-theme"
                  style={{ marginTop: 8 }}
                  onClick={() => setLightOpen(false)}
                >
                  Close Light
                </button>
              </Overlay.Content>
            </Overlay>
          </Div>
        </section>
      </div>
    </div>
  )
}
