import type { ReactNode } from 'react'
import { A, Article, Code, Div, H1, H2, Main, P, Section } from '@reference-ui/react'

export interface PrimaryActionProps {
  href: string
  label: string
}

export function PrimaryAction({ href, label }: PrimaryActionProps) {
  return (
    <A data-slot="primary-action" href={href} color="text" fontWeight="bold">
      {label}
    </A>
  )
}

export interface FeatureCardProps {
  actionHref: string
  actionLabel: string
  eyebrow: string
  summary: ReactNode
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
    <Article data-slot="feature-card" p="card" borderWidth="1px" borderRadius="md">
      <P color="text" fontSize="sm">
        {eyebrow}
      </P>
      <H2 color="text">{title}</H2>
      <P color="text">{summary}</P>
      <PrimaryAction href={actionHref} label={actionLabel} />
    </Article>
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
    <Section data-slot="hero-banner" p="card" bg="text" color="white">
      <H1>{heading}</H1>
      <P>{body}</P>
      <PrimaryAction href={ctaHref} label={ctaLabel} />
    </Section>
  )
}

export function ComponentShowcase() {
  return (
    <Main data-slot="component-showcase" p="card">
      <HeroBanner
        heading="Reference UI MCP matrix"
        body="Published MCP smoke test."
        ctaHref="/get-started"
        ctaLabel="Start"
      />
      <FeatureCard
        eyebrow="Guide"
        title="Inspect generated components"
        summary={
          <>
            Verify the <Code>src/Index.tsx</Code> inventory and relationships.
          </>
        }
        actionHref="/mcp"
        actionLabel="Inspect"
      />
      <Div data-slot="style-prop-sentinel" color="text" p="card" />
    </Main>
  )
}
