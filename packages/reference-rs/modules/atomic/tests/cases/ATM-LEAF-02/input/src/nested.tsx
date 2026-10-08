import { Div } from '@reference-ui/react'

export function App({
  isLine,
  horizontal,
  isSelected,
}: {
  isLine: boolean
  horizontal: boolean
  isSelected: boolean
}) {
  return (
    <Div
      borderBottom={
        isLine && horizontal
          ? isSelected
            ? '3px solid'
            : '3px solid transparent'
          : undefined
      }
    />
  )
}
