import * as React from 'react'
import { Button, Div, Span } from '@reference-ui/react'

export default function CosmosDecorator({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = React.useState(true)

  return (
    <Div
      colorMode={dark ? 'dark' : undefined}
      display="flex"
      flexDirection="column"
      boxSizing="border-box"
      height="100%"
      minHeight="100vh"
      width="100%"
      bg={dark ? 'gray.950' : 'gray.50'}
      position="relative"
    >
      <Div
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        gap="2r"
        paddingBlock="2r"
        paddingInline="3r"
        flexShrink="0"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={dark ? 'gray.800' : 'gray.200'}
        bg={dark ? 'gray.900' : 'gray.100'}
      >
        <Span fontSize="sm" color={dark ? 'gray.400' : 'gray.600'}>
          Cosmos
        </Span>
        <Button
          type="button"
          fontSize="sm"
          paddingInline="3r"
          paddingBlock="1r"
          borderRadius="md"
          bg={dark ? 'gray.800' : 'white'}
          color={dark ? 'gray.100' : 'gray.900'}
          borderWidth="1px"
          borderStyle="solid"
          borderColor={dark ? 'gray.700' : 'gray.300'}
          onClick={() => setDark((d) => !d)}
        >
          {dark ? 'Light' : 'Dark'}
        </Button>
      </Div>

      <Div
        flex="1"
        minHeight="0"
        overflow="auto"
        padding="clamp(1.25rem, 4vw, 2.75rem)"
        display="flex"
        flexDirection="column"
      >
        <Div maxWidth="min(72rem, 100%)" width="100%" marginInline="auto" flex="1">
          {children}
        </Div>
      </Div>
    </Div>
  )
}
