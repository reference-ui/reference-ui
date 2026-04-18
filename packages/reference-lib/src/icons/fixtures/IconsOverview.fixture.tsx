import { Div, Span } from '@reference-ui/react'
import { AbcIcon, AccountCircleIcon } from '../index'

export default (
  <Div
    display="flex"
    flexDirection="column"
    gap="4r"
    padding="6r"
    borderRadius="2xl"
    bg="white"
    borderWidth="1px"
    borderColor="gray.200"
    boxShadow="md"
    maxWidth="720px"
  >
    <Div display="flex" flexDirection="column" gap="1r">
      <Span fontSize="3xl" fontWeight="700" color="gray.950">
        Reference icons as Div wrappers
      </Span>
      <Span fontSize="md" color="gray.600" lineHeight="relaxed">
        These icons are exported through `@reference-ui/lib/icons`, but their JSX boundary is now a
        Reference `Div`, so style-bearing icon names can participate in the same JSX scan surface.
      </Span>
    </Div>

    <Div display="flex" gap="3r" alignItems="center" flexWrap="wrap">
      <AbcIcon
        size="10r"
        color="red"
        bg="red.100"
        borderRadius="xl"
        padding="2r"
        borderWidth="1px"
        borderColor="blue.100"
        aria-label="ABC icon"
      />
      <AccountCircleIcon
        variant="filled"
        size="10r"
        color="emerald.600"
        bg="emerald.50"
        borderRadius="full"
        padding="2r"
        borderWidth="1px"
        borderColor="emerald.100"
        aria-label="Account icon"
      />
    </Div>
  </Div>
)