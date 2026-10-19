// Slug-to-MDX page rendering inside the doc shell.
// It takes the route slug and emits the article with header, body, and pager. The index
// route pins the initialize slug through the fixed-slug prop.
import { useParams } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { docs, slugToModule } from '../collections/runtime'
import { DocMetaContext } from '../shared/providers/DocMetaContext'

export function DocPage({ slug: fixedSlug }: { slug?: string } = {}) {
  const params = useParams({ strict: false })
  const slug = fixedSlug ?? (params.slug as string | undefined)
  const Doc = slug ? slugToModule[slug] : undefined

  if (!Doc) {
    return (
      <Div color="docsMuted" fontSize="4r">
        Not found
      </Div>
    )
  }
  return (
    <DocMetaContext.Provider value={docs.find(doc => doc.slug === slug)}>
      <Doc />
    </DocMetaContext.Provider>
  )
}
