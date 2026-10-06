import { useParams } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { slugToModule } from '../collections/runtime'

export function DocPage({ slug: fixedSlug }: { slug?: string } = {}) {
  const params = useParams({ strict: false })
  const slug = fixedSlug ?? (params.slug as string | undefined)
  const Doc = slug ? slugToModule[slug] : undefined

  if (!Doc) {
    return (
      <Div color="docsMuted" fontSize="md">
        Not found
      </Div>
    )
  }
  return <Doc />
}
