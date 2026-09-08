import { A, Div, Span } from '@reference-ui/react'

export default (
  <Div
    display="flex"
    flexDirection="column"
    gap="5r"
    padding="6r"
    borderRadius="lg"
    bg="white"
    boxShadow="lg"
    borderWidth="1px"
    borderColor="gray.200"
    width="600px"
    height="600px"
  >
    <Div display="flex" flexDirection="column" gap="2r">
      <Span fontSize="4xl" fontWeight="700" letterSpacing="tight" color="gray.950">
        Reference Lib playground
      </Span>
      <Span fontSize="lg" color="gray.600" lineHeight="relaxed" maxWidth="36rem">
        Browse stories in the sidebar to preview and inspect components in isolation.
        Powered by the Book single-document playground.
      </Span>
    </Div>
    <Div
      padding="4r"
      borderRadius="lg"
      bg="gray.50"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Span
        fontSize="sm"
        fontWeight="600"
        color="gray.700"
        display="block"
        marginBottom="2r"
      >
        Tip
      </Span>
      <Span fontSize="sm" color="gray.600" lineHeight="relaxed">
        Run{' '}
        <Span fontFamily="mono" color="gray.800">
          pnpm dev:lib
        </Span>{' '}
        from the workspace root to launch Book on port 5000 with Fast Refresh.
      </Span>
    </Div>
  </Div>
)
