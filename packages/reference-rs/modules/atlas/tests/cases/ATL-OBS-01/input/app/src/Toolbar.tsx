import { Button } from '@reference-ui/react'

export function Toolbar({ go }: { go: () => void }) {
  return (
    <>
      <Button style={{ a: { b: 1 } }} onClick={() => go()} disabled>
        Save
      </Button>
      <Button style={{ a: { b: 1 } }} onClick={() => go()} disabled />
    </>
  )
}
