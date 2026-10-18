import '@reference-ui/lib/styles.css'
import '@reference-ui/react/styles.css'
import '../app.css'
import { createRoot } from 'react-dom/client'
import { Div, H1, P, Button as GeneratedButton } from '@reference-ui/react'
import { Button as LibraryButton } from '@reference-ui/lib/primitives'
import { ReferenceLibrary } from '@reference-ui/lib'

createRoot(document.getElementById('root')!).render(
  <ReferenceLibrary>
    <Div colorMode="light" bg="studio.canvas" color="studio.ink" minHeight="100vh" padding="studio.page">
      <H1 fontSize="1.8rem">App token styles on public primitives</H1>
      <P marginY="studio.gap">Both controls below request the same app token background, padding and radius.</P>
      <Div display="flex" flexDir="column" gap="studio.gap" alignItems="start">
        <P>Generated Button (@reference-ui/react)</P>
        <GeneratedButton data-testid="generated-button" bg="studio.brand" color="white" padding="studio.gap" borderRadius="studio.control">Save changes</GeneratedButton>
        <P>Library Button (@reference-ui/lib/primitives)</P>
        <LibraryButton data-testid="library-button" bg="studio.brand" color="white" padding="studio.gap" borderRadius="studio.control">Save changes</LibraryButton>
      </Div>
    </Div>
  </ReferenceLibrary>
)
