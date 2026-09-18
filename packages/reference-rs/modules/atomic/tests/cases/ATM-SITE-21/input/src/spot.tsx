import { Div } from '@reference-ui/react'

// Simple conditional ternary: both arms compile.
export const a = <Div _hover={on ? { backgroundColor: 'red' } : { backgroundColor: 'blue' }} />

// Nested Tabs shape: guard, nested ternary, silent undefined arm.
export const b = (
  <Div
    _hover={
      guard
        ? line
          ? { color: 'green', borderColor: 'black' }
          : { color: 'white', bg: 'gray' }
        : undefined
    }
  />
)

// css-prop ternary control: both arms compile with no condition.
export const c = <Div css={pick ? { color: 'yellow' } : { color: 'purple' }} />

void a
void b
void c
