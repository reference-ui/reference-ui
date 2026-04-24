export interface PrimaryActionProps {
  href: string
  label: string
}

export function PrimaryAction({ href, label }: PrimaryActionProps) {
  return (
    <a data-slot="primary-action" href={href}>
      {label}
    </a>
  )
}

export interface FeatureCardProps {
  actionHref: string
  actionLabel: string
  eyebrow: string
  summary: string
  title: string
}

export function FeatureCard({
  actionHref,
  actionLabel,
  eyebrow,
  summary,
  title,
}: FeatureCardProps) {
  return (
    <article data-slot="feature-card">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <p>{summary}</p>
      <PrimaryAction href={actionHref} label={actionLabel} />
    </article>
  )
}

export interface HeroBannerProps {
  body: string
  ctaHref: string
  ctaLabel: string
  heading: string
}

export function HeroBanner({ body, ctaHref, ctaLabel, heading }: HeroBannerProps) {
  return (
    <section data-slot="hero-banner">
      <h1>{heading}</h1>
      <p>{body}</p>
      <PrimaryAction href={ctaHref} label={ctaLabel} />
    </section>
  )
}

export function ComponentShowcase() {
  return (
    <main data-slot="component-showcase">
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
    </main>
  )
}