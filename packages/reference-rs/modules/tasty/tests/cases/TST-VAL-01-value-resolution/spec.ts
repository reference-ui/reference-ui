/**
 * Station specification for TST-VAL-01-value-resolution.
 * Verifies additive resolved payloads for value-derived and indexed access types.
 * Proves primary SPEC ID anchor TST-VAL-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyApi, type TastyCaseResult } from "../../helpers.js"

async function verifyIntentAndSizeValues(api: TastyApi): Promise<void> {
  const intentKey = await api.loadSymbolByName("IntentKey")
  const intentValue = await api.loadSymbolByName("IntentValue")
  const sizeValue = await api.loadSymbolByName("SizeValue")

  const intentKeyRaw = intentKey.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(intentKeyRaw.kind).toBe("type_operator")
  expect(intentKeyRaw.resolved?.kind).toBe("union")
  expect(intentKeyRaw.resolved?.types?.map((item) => item.value)).toEqual(["'primary'", "'danger'"])

  const intentValueRaw = intentValue.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(intentValueRaw.kind).toBe("indexed_access")
  expect(intentValueRaw.resolved?.kind).toBe("union")
  expect(intentValueRaw.resolved?.types?.map((item) => item.value)).toEqual(["'blue'", "'red'"])

  const sizeValueRaw = sizeValue.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(sizeValueRaw.kind).toBe("indexed_access")
  expect(sizeValueRaw.resolved?.kind).toBe("union")
  expect(sizeValueRaw.resolved?.types?.map((item) => item.value)).toEqual(["'sm'", "'md'", "'lg'"])
}

async function verifyToneAndVariantValues(api: TastyApi): Promise<void> {
  const toneLabel = await api.loadSymbolByName("ToneLabel")
  const variantTone = await api.loadSymbolByName("VariantTone")
  const concreteVariantMeta = await api.loadSymbolByName("ConcreteVariantMeta")

  const toneLabelRaw = toneLabel.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(toneLabelRaw.kind).toBe("template_literal")
  expect(toneLabelRaw.resolved?.kind).toBe("union")
  expect(toneLabelRaw.resolved?.types?.map((item) => item.value)).toEqual([
    "'tone-sm'",
    "'tone-md'",
    "'tone-lg'",
  ])

  const variantToneRaw = variantTone.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(variantToneRaw.kind).toBe("template_literal")
  expect(variantToneRaw.resolved?.kind).toBe("union")
  expect(variantToneRaw.resolved?.types?.map((item) => item.value)).toEqual([
    "'tone-solid'",
    "'tone-ghost'",
    "'tone-outline'",
  ])

  const concreteVariantMetaRaw = concreteVariantMeta.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; members?: Array<{ name?: string }> }> }
  }
  expect(concreteVariantMetaRaw.kind).toBe("conditional")
  expect(concreteVariantMetaRaw.resolved?.kind).toBe("union")
  expect(concreteVariantMetaRaw.resolved?.types?.map((item) => item.kind)).toEqual(["object", "object"])
  expect(
    concreteVariantMetaRaw.resolved?.types?.map((item) => item.members?.map((m) => m.name).join(","))
  ).toEqual(["emphasis,fill", "emphasis,fill"])
}

async function verifyInterfaceAndMemberValues(api: TastyApi): Promise<void> {
  const intentFromInterface = await api.loadSymbolByName("IntentFromInterface")
  const withValueResolution = await api.loadSymbolByName("WithValueResolution")

  const intentFromInterfaceRaw = intentFromInterface.getUnderlyingType()?.getRaw() as {
    kind?: string
    resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
  }
  expect(intentFromInterfaceRaw.kind).toBe("indexed_access")
  expect(intentFromInterfaceRaw.resolved?.kind).toBe("union")
  expect(intentFromInterfaceRaw.resolved?.types?.map((item) => item.value)).toEqual(["'primary'", "'danger'"])

  const sizeMember = findMember(withValueResolution, "size").getType()
  expect(sizeMember?.getResolved()?.describe()).toBe("'sm' | 'md' | 'lg'")
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-VAL-01",
  async verify({ api }) {
    await verifyIntentAndSizeValues(api)
    await verifyToneAndVariantValues(api)
    await verifyInterfaceAndMemberValues(api)
  },
}

export default spec
