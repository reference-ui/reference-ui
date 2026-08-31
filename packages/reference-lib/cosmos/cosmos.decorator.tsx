import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ReferenceLibrary } from '../src/components/ReferenceLibrary'

export default function CosmosDecorator({ children }: { children: React.ReactNode }) {
  return (
    <Div
      p="6r"
      minH="100vh"
      boxSizing="border-box"
      bg="colors.gray.50"
      color="colors.gray.900"
      fontFamily="sans"
    >
      <ReferenceLibrary.LiveAnnouncer />
      <ReferenceLibrary.ToastHost />
      {children}
    </Div>
  )
}
