/**
 * Station specification for TST-TMP-01-template-literals.
 * Verifies template literal type structures and keyof operator parts.
 * Proves primary SPEC ID anchor TST-TMP-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-TMP-01",
  async verify({ api }) {
    const sizeVariant = await api.loadSymbolByName("SizeVariant")
    const tokenKeyLabel = await api.loadSymbolByName("TokenKeyLabel")
    const withTemplateLiterals = await api.loadSymbolByName("WithTemplateLiterals")

    const sizeVariantRaw = sizeVariant.getUnderlyingType()?.getRaw() as {
      kind?: string
      parts?: Array<{ kind?: string; value?: unknown }>
    }
    expect(sizeVariantRaw.kind).toBe("template_literal")
    expect(sizeVariantRaw.parts?.[0]).toEqual({ kind: "text", value: "size-" })
    expect(sizeVariantRaw.parts?.[1]?.kind).toBe("type")

    const tokenLabelRaw = tokenKeyLabel.getUnderlyingType()?.getRaw() as {
      parts?: Array<{ kind?: string; value?: { kind?: string; operator?: string; target?: { name?: string } } }>
    }
    expect(tokenLabelRaw.parts?.[1]?.value?.kind).toBe("type_operator")
    expect(tokenLabelRaw.parts?.[1]?.value?.operator).toBe("keyof")
    expect(tokenLabelRaw.parts?.[1]?.value?.target?.name).toBe("Tokens")

    const labelType = findMember(withTemplateLiterals, "label").getType()?.getRaw() as {
      kind?: string
      parts?: Array<{ kind?: string; value?: { kind?: string; operator?: string } }>
    }
    expect(labelType.kind).toBe("template_literal")
    expect(labelType.parts?.[1]?.value?.kind).toBe("type_operator")
    expect(labelType.parts?.[1]?.value?.operator).toBe("keyof")
  },
}

export default spec
