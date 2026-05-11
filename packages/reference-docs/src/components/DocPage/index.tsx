import { useParams } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { slugToModule } from '../../collections/runtime'

export function DocPage() {
  const { slug } = useParams({ strict: false })
  const Doc = slugToModule[slug as string]
  if (!Doc) {
    return (
      <Div color="docsMuted" fontSize="md">
        Not found
      </Div>
    )
  }
  return <Doc />
}
