import { useParams } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { slugToModule } from '../../lib/docs'

export function DocPage() {
  const { slug } = useParams({ strict: false })
  const mod = slugToModule[slug as string]
  if (!mod) return <Div>Not found</Div>
  const Doc = mod.default
  return <Doc />
}
