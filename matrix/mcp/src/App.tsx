import { ComponentShowcase, FeatureCard, HeroBanner, PrimaryAction } from './components'

export function App() {
  return (
    <>
      <ComponentShowcase />
      <HeroBanner
        heading="Reference UI MCP matrix"
        body="Published MCP smoke test."
        ctaHref="/get-started"
        ctaLabel="Start"
      />
      <FeatureCard
        eyebrow="Guide"
        title="Inspect generated components"
        summary="Verify the MCP inventory and relationships."
        actionHref="/mcp"
        actionLabel="Inspect"
      />
      <PrimaryAction href="/docs" label="Docs" />
    </>
  )
}