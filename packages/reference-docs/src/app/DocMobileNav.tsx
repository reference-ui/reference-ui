import { useEffect, useState } from 'react'
import { Div } from '@reference-ui/react'
import { CloseIcon } from '@reference-ui/lib'
import { Brand } from './Brand'
import { DocNav } from './DocSidebar'
import { IconButton } from './IconButton'

/**
 * Off-canvas navigation for small viewports. Mounts only while open and fades
 * in on the next frame; closes on scrim click, the close button, or a link tap.
 * Focus moves to the close control when it opens.
 */
export function DocMobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!open) {
      setShown(false)
      return
    }
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!shown) return
    document
      .querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close navigation"]')
      ?.focus()
  }, [shown])

  if (!open) return null

  return (
    <Div position="fixed" inset="0" zIndex="50" display="flex" r={{ 768: { display: 'none' } }}>
      <Div
        position="absolute"
        inset="0"
        bg="docsScrim"
        onClick={onClose}
        opacity={shown ? 1 : 0}
        transition="opacity 0.2s ease"
      />
      <Div
        role="dialog"
        aria-modal="true"
        aria-label="Documentation navigation"
        position="relative"
        width="300px"
        maxWidth="86vw"
        height="100%"
        display="flex"
        flexDirection="column"
        bg="docsPageBg"
        borderRight="1px solid"
        borderRightColor="docsBorder"
        transform={shown ? 'translateX(0)' : 'translateX(-100%)'}
        transition="transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Div
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          height="14r"
          paddingX="4r"
          flexShrink="0"
          borderBottom="1px solid"
          borderBottomColor="docsBorder"
        >
          <Brand />
          <IconButton label="Close navigation" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Div>
        <Div flex="1" overflowY="auto" padding="6r 4r">
          <DocNav onNavigate={onClose} />
        </Div>
      </Div>
    </Div>
  )
}
