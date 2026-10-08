import { recipe, Button, Div } from '@reference-ui/react'

const button = recipe({
  className: 'button',
  base: { display: 'inline-flex' },
  variants: {
    variant: {
      primary: { color: 'white' },
    },
  },
})

export function App() {
  return <Button variant="primary" mt="2r" bg="red.500" />
}

button({ variant: 'primary' })
