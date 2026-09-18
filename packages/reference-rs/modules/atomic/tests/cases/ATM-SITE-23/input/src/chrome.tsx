import { Div } from '@reference-ui/react'

// Book chrome divider shape: a component-body const ternary feeds a color prop.
export function Shell({ theme }: { theme: string }) {
  const isDark = theme === 'dark'
  const subtleBorder = isDark ? 'gray.800' : 'gray.200'
  return <Div p="3r" borderBottom="1px solid" borderBottomColor={subtleBorder} />
}

// Component-body single literal resolves beside the ternary.
export function Card() {
  const edge = 'gray.700'
  return <Div borderBottomColor={edge} />
}
