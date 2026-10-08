import { Div } from '@reference-ui/react'

const shade = (level: string) => `red.${level}`
const getConfig = () => ({ color: 'teal.600', backgroundColor: 'navy' })

export function App() {
  return <Div color={shade('600')} {...getConfig()} padding="4px" />
}
