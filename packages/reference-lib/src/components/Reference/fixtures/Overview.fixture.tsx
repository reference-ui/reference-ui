import { A, Div, Span } from '@reference-ui/react'

export default (
  <Div
    display="flex"
    flexDirection="column"
    gap="5r"
    padding="6r"
    borderRadius="2xl"
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
        Browse fixtures in the tree to preview components in isolation. This UI is powered
        by{' '}
        <A
          href="https://reactcosmos.org/"
          target="_blank"
          rel="noreferrer"
          color="blue.600"
          fontWeight="500"
        >
          React Cosmos
        </A>
        .
      </Span>
    </Div>
    <Div
      padding="4r"
      borderRadius="xl"
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
          pnpm run cosmos
        </Span>{' '}
        from this package after{' '}
        <Span fontFamily="mono" color="gray.800">
          ref sync
        </Span>{' '}
        (core must be built first).
      </Span>
    </Div>
  </Div>
)
