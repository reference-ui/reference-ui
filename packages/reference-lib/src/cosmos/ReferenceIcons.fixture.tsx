import {
  HomeIcon,
  SearchIcon,
  SettingsIcon,
  FavoriteIcon,
  BoltIcon,
  PaletteIcon,
} from '@reference-ui/icons'
import { Div, Span } from '@reference-ui/react'

export default function ReferenceIconsFixture() {
  return (
    <Div display="flex" flexDirection="column" gap="5r" padding="5r">
      <Div display="flex" flexDirection="column" gap="1r">
        <Span fontSize="2xl" fontWeight="700">
          Reference icons
        </Span>
        <Span color="gray.400" maxWidth="48rem">
          Quick Cosmos smoke fixture for icon sizing. Each row mounts the same icons with a
          different `size` prop.
        </Span>
      </Div>
      <Div size="9r" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" bg="red.400" color="blue.300">hi</Div>
      <Div
        display="grid"
        gridTemplateColumns="repeat(3, minmax(0, 1fr))"
        gap="3r"
        padding="3r"
        borderRadius="xl"
        bg="gray.900"
        borderWidth="1px"
        borderColor="gray.800"
      >
        <Div display="flex" alignItems="center" justifyContent="center" borderRadius="lg" bg="gray.950" color="blue.300">
          <HomeIcon size="12r" color="blue.900" />
    
        </Div>
        <Div display="flex" alignItems="center" justifyContent="center" minHeight="10r" borderRadius="lg" bg="gray.950" color="green.300">
          <SearchIcon size="10r" />
        </Div>
        <Div display="flex" alignItems="center" justifyContent="center" minHeight="10r" borderRadius="lg" bg="gray.950" color="pink.300">
          <SettingsIcon size="2r" />
        </Div>
        <Div display="flex" alignItems="center" justifyContent="center" minHeight="10r" borderRadius="lg" bg="gray.950" color="red.300">
          <FavoriteIcon size="3rem" />
        </Div>
        <Div display="flex" alignItems="center" justifyContent="center" minHeight="10r" borderRadius="lg" bg="gray.950" color="yellow.300">
          <BoltIcon size="56px" />
        </Div>
        <Div display="flex" alignItems="center" justifyContent="center" minHeight="10r" borderRadius="lg" bg="gray.950" color="purple.300">
          <PaletteIcon size="7r" />
        </Div>
      </Div>
    </Div>
  )
}