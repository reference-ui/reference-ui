import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'

/**
 * Flat specimen frame for live examples. A tinted panel with no border, so an
 * example reads as a distinct surface without adding another hairline to the
 * page. Content is centered and may wrap.
 */
const frame = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4r',
  minHeight: '20r',
  padding: '8r',
  borderRadius: 'md',
  bg: 'docsPanelBg',
  marginBottom: '4r',
})

export function Preview({ children }: { children: ReactNode }) {
  return <Div className={frame}>{children}</Div>
}
