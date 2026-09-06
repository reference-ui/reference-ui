import * as React from 'react'
import {
  Button,
  Div,
  Span,
  Input,
  P,
  H3,
  H4,
  Label,
} from '@reference-ui/react'
import {
  AddIcon,
  KeyboardArrowDownIcon,
  SettingsIcon,
  UploadFileIcon,
} from '@reference-ui/icons'

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Div
      p="5r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="lg"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      display="flex"
      flexDirection="column"
      gap="4r"
    >
      <Div>
        <H4 fontSize="3.5r" fontWeight="600" m="0" color="design.text.base">
          {title}
        </H4>
        {subtitle && (
          <P fontSize="3r" color="design.text.light" mt="0.5r" mb="0">
            {subtitle}
          </P>
        )}
      </Div>
      {children}
    </Div>
  )
}

export default {
  Variants: () => (
    <Div
      maxW="220r"
      mx="auto"
      p="6r"
      display="flex"
      flexDirection="column"
      gap="5r"
    >
      <Div>
        <H3 fontSize="5r" fontWeight="700" m="0" color="design.text.base">
          Button Variants
        </H3>
        <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
          Native primitive button variants styled with zero-specificity <code>:where()</code>.
          Provides Default (neutral outline), Primary (flashy high-contrast CTA), and Ghost (transparent background &amp; no expanding ring on active).
        </P>
      </Div>

      <SectionCard
        title="Three First-Class Button Variants"
        subtitle="Un-opinionated baseline variants mapped directly from the variant prop to data-variant"
      >
        <Div display="flex" flexWrap="wrap" gap="4r" alignItems="center">
          <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
            <Span fontSize="2.5r" color="design.text.light">
              Default (Outline / Secondary)
            </Span>
            <Button type="button">Default Button</Button>
          </Div>

          <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
            <Span fontSize="2.5r" color="design.text.light">
              Explicit Default
            </Span>
            <Button type="button" variant="default">
              Explicit Default
            </Button>
          </Div>

          <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
            <Span fontSize="2.5r" color="design.text.light">
              Primary (Flashy White CTA)
            </Span>
            <Button type="button" variant="primary">
              Primary Button
            </Button>
          </Div>

          <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
            <Span fontSize="2.5r" color="design.text.light">
              Ghost (No Outline / Steps Up A Shade)
            </Span>
            <Button type="button" variant="ghost">
              Ghost Button
            </Button>
          </Div>
        </Div>
      </SectionCard>

      <SectionCard
        title="Interactive States Comparison"
        subtitle="Resting, Disabled, and Icons across all three variants"
      >
        <Div display="flex" flexDirection="column" gap="4r">
          <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
            <Span width="30r" fontSize="3r" fontWeight="600" color="design.text.base">
              Default:
            </Span>
            <Button type="button">Resting</Button>
            <Button type="button" disabled>Disabled</Button>
            <Button type="button">
              <AddIcon />
              <span>With Leading Icon</span>
            </Button>
            <Button type="button">
              <span>Trailing Chevron</span>
              <KeyboardArrowDownIcon />
            </Button>
            <Button type="button" aria-label="Settings">
              <SettingsIcon />
            </Button>
          </Div>

          <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
            <Span width="30r" fontSize="3r" fontWeight="600" color="design.text.base">
              Primary:
            </Span>
            <Button type="button" variant="primary">Resting</Button>
            <Button type="button" variant="primary" disabled>Disabled</Button>
            <Button type="button" variant="primary">
              <AddIcon />
              <span>With Leading Icon</span>
            </Button>
            <Button type="button" variant="primary">
              <span>Trailing Chevron</span>
              <KeyboardArrowDownIcon />
            </Button>
            <Button type="button" variant="primary" aria-label="Settings">
              <SettingsIcon />
            </Button>
          </Div>

          <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
            <Span width="30r" fontSize="3r" fontWeight="600" color="design.text.base">
              Ghost:
            </Span>
            <Button type="button" variant="ghost">Resting</Button>
            <Button type="button" variant="ghost" disabled>Disabled</Button>
            <Button type="button" variant="ghost">
              <AddIcon />
              <span>With Leading Icon</span>
            </Button>
            <Button type="button" variant="ghost">
              <span>Trailing Chevron</span>
              <KeyboardArrowDownIcon />
            </Button>
            <Button type="button" variant="ghost" aria-label="Settings">
              <SettingsIcon />
            </Button>
          </Div>
        </Div>
      </SectionCard>

      <SectionCard
        title="Form & File Upload Alignment"
        subtitle="Native input[type=file] browse button aligned with secondary/default button principles"
      >
        <Div display="flex" flexDirection="column" gap="3r">
          <Div display="flex" alignItems="center" gap="4r" flexWrap="wrap">
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Label htmlFor="demo-file-input" fontSize="2.5r" color="design.text.light">
                Native File Input (Browse button steps up a shade on hover)
              </Label>
              <Input id="demo-file-input" type="file" />
            </Div>
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" color="design.text.light">
                Reference Secondary / Default Button
              </Span>
              <Button type="button">
                <UploadFileIcon />
                <span>Upload File</span>
              </Button>
            </Div>
          </Div>
        </Div>
      </SectionCard>
    </Div>
  ),
}
