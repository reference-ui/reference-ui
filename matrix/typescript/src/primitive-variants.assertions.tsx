/**
 * Primitive Variant type assertions.
 *
 * Verifies that standard registered variants on primitives (Button, Input, Div, Span, Table, etc.)
 * provide strong autocomplete while permitting arbitrary strings without type errors.
 * Also verifies module augmentation of `PrimitiveVariantRegistry`.
 */
import {
  A,
  Button,
  Code,
  Div,
  Hr,
  Input,
  Kbd,
  Select,
  Span,
  Table,
  Textarea,
} from '@reference-ui/react'

// ─── Button Variants ────────────────────────────────────────────────────────
export const btnDefault = <Button variant="default">Default</Button>
export const btnPrimary = <Button variant="primary">Primary</Button>
export const btnGhost = <Button variant="ghost">Ghost</Button>
export const btnCustom = <Button variant="custom-variant">Custom</Button>

// ─── Input & Textarea & Select Variants ──────────────────────────────────────
export const inputOutline = <Input variant="outline" />
export const inputFilled = <Input variant="filled" />
export const inputFlushed = <Input variant="flushed" />
export const inputUnstyled = <Input variant="unstyled" />

export const textareaOutline = <Textarea variant="outline" />
export const textareaFilled = <Textarea variant="filled" />

export const selectOutline = <Select variant="outline" />
export const selectFilled = <Select variant="filled" />

// ─── Div, Span, Table Variants ──────────────────────────────────────────────
export const divCard = <Div variant="card">Card</Div>
export const divWell = <Div variant="well">Well</Div>
export const divFloating = <Div variant="floating">Floating</Div>
export const divInset = <Div variant="inset">Inset</Div>

export const spanBadge = <Span variant="badge">Badge</Span>
export const spanPill = <Span variant="pill">Pill</Span>

export const tableSimple = <Table variant="simple" />
export const tableStriped = <Table variant="striped" />
export const tableCompact = <Table variant="compact" />
export const tableBorderless = <Table variant="borderless" />

// ─── Inline & Semantic Primitives ───────────────────────────────────────────
export const aAccent = <A variant="accent" href="#">Link</A>
export const codeInline = <Code variant="inline">code</Code>
export const kbdRaised = <Kbd variant="raised">cmd</Kbd>
export const hrDashed = <Hr variant="dashed" />

// ─── Module Augmentation ────────────────────────────────────────────────────
declare module '@reference-ui/react' {
  interface PrimitiveVariantRegistry {
    button: 'default' | 'primary' | 'ghost' | 'glow'
  }
}

export const btnAugmented = <Button variant="glow">Glow</Button>
