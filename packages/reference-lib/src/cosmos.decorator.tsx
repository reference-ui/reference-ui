import * as React from 'react'

/**
 * Wraps all fixtures: generous padding, centered column, readable max width.
 */
export default function PlaygroundDecorator({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        minHeight: '100%',
        padding: 'clamp(1.25rem, 4vw, 2.75rem)',
        background:
          'linear-gradient(165deg, #fafafa 0%, #f4f4f5 45%, #ececee 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 'min(72rem, 100%)',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
