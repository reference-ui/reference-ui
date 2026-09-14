/**
 * Station specification for TST-SNK-01-kitchen-sink.
 * Verifies comprehensive component typing, mapped types, inheritance, and JSDoc.
 * Proves primary SPEC ID anchor TST-SNK-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyApi, type TastyCaseResult } from "../../helpers.js"

async function verifyKitchenSinkSymbols(api: TastyApi): Promise<void> {
  const names = new Set((await api.searchSymbols("DocsReference")).map((e) => e.name))
  expect(names.has("DocsReferenceButtonProps")).toBe(true)
  expect(names.has("DocsReferenceToneLabels")).toBe(true)
  expect(names.has("DocsReferenceInteractiveElement")).toBe(true)
  expect(names.has("DocsReferenceVariantMeta")).toBe(true)
  expect(names.has("DocsReferenceAsyncState")).toBe(true)
  expect(names.has("DocsReferenceComposedButtonProps")).toBe(true)
  expect(names.has("DocsReferenceSplitButtonProps")).toBe(true)
  expect(names.has("DocsReferenceCurrentIntent")).toBe(true)
}

async function verifyKitchenSinkAliases(api: TastyApi): Promise<void> {
  const toneLabels = await api.loadSymbolByName("DocsReferenceToneLabels")
  const resolvedTone = await api.loadSymbolByName("DocsReferenceResolvedTone")
  const toneKey = await api.loadSymbolByName("DocsReferenceToneKey")
  const variantMeta = await api.loadSymbolByName("DocsReferenceVariantMeta")
  const buttonVariantMeta = await api.loadSymbolByName("DocsReferenceButtonVariantMeta")

  const mapped = toneLabels.getUnderlyingType()?.getRaw() as {
    kind?: string
    typeParam?: string
    nameType?: { kind?: string }
  }
  expect(mapped.kind).toBe("mapped")
  expect(mapped.typeParam).toBe("K")
  expect(mapped.nameType?.kind).toBe("template_literal")

  expect(resolvedTone.getUnderlyingType()?.getKind()).toBe("template_literal")
  expect(toneKey.getUnderlyingType()?.getKind()).toBe("template_literal")

  const cond = variantMeta.getUnderlyingType()?.getRaw() as { kind?: string; checkType?: { name?: string } }
  expect(cond.kind).toBe("conditional")
  expect(cond.checkType?.name).toBe("T")

  const inst = buttonVariantMeta.getUnderlyingType()?.getRaw() as { kind?: string; checkType?: { name?: string } }
  expect(inst.kind).toBe("conditional")
  expect(inst.checkType?.name).toBe("DocsReferenceButtonVariant")
}

async function verifyKitchenSinkStructures(api: TastyApi): Promise<void> {
  const interactive = await api.loadSymbolByName("DocsReferenceInteractiveElement")
  const composed = await api.loadSymbolByName("DocsReferenceComposedButtonProps")
  const padding = await api.loadSymbolByName("DocsReferenceButtonPadding")
  const currentIntent = await api.loadSymbolByName("DocsReferenceCurrentIntent")

  expect(interactive.getUnderlyingType()?.isUnion()).toBe(true)
  const branches = interactive.getUnderlyingType()?.getUnionTypes() ?? []
  expect(branches).toHaveLength(2)
  expect(branches.every((b) => b.getKind() === "object")).toBe(true)

  expect(composed.getUnderlyingType()?.getKind()).toBe("intersection")

  const tupleRaw = padding.getUnderlyingType()?.getRaw() as { kind?: string; elements?: Array<{ label?: string }> }
  expect(tupleRaw.kind).toBe("tuple")
  expect(tupleRaw.elements?.map((e) => e.label)).toEqual(["inline", "block"])

  const intentAlias = currentIntent.getUnderlyingType()?.getRaw() as {
    kind?: string
    object?: { name?: string }
    index?: { kind?: string; value?: string }
  }
  expect(intentAlias.kind).toBe("indexed_access")
  expect(intentAlias.object?.name).toBe("DocsReferenceButtonProps")
  expect(intentAlias.index?.kind).toBe("literal")
  expect(intentAlias.index?.value).toContain("currentIntent")
}

async function verifyKitchenSinkButtonProps(api: TastyApi): Promise<void> {
  const buttonProps = await api.loadSymbolByName("DocsReferenceButtonProps")
  const raw = buttonProps.getRaw() as { description?: string; jsdoc?: { summary?: string } }
  expect(raw.description).toContain("live reference table")
  expect(raw.jsdoc?.summary).toContain("live reference table")

  const currentIntent = findMember(buttonProps, "currentIntent").getType()?.getRaw() as { kind?: string }
  expect(currentIntent.kind).toBe("indexed_access")

  const resolvedSize = findMember(buttonProps, "resolvedSize").getType()
  expect(resolvedSize?.isReference()).toBe(true)
  expect(resolvedSize?.getReferencedSymbol()?.getName()).toBe("DocsReferenceResolvedSize")

  const toneLabelsMember = findMember(buttonProps, "toneLabels").getType()
  expect(toneLabelsMember?.isReference()).toBe(true)
  expect(toneLabelsMember?.getReferencedSymbol()?.getName()).toBe("DocsReferenceToneLabels")

  const onPress = findMember(buttonProps, "onPress").getType()
  expect(onPress?.getKind()).toBe("function")

  const renderIcon = findMember(buttonProps, "renderIcon")
  expect(renderIcon.getJsDocTags().map((t) => t.getName())).toEqual(
    expect.arrayContaining(["param", "returns", "see", "example"])
  )

  const formatLabel = findMember(buttonProps, "formatLabel")
  expect(formatLabel.getJsDocTags().map((t) => t.getName())).toEqual(
    expect.arrayContaining(["param", "deprecated", "remarks"])
  )
}

async function verifyKitchenSinkInheritance(api: TastyApi): Promise<void> {
  const asyncState = await api.loadSymbolByName("DocsReferenceAsyncState")
  expect(asyncState.getKind()).toBe("interface")
  const params = asyncState.getTypeParameters()
  expect(params).toHaveLength(1)
  expect(params[0]?.name).toBe("TData")
  expect(params[0]?.constraint).toMatchObject({ kind: "intrinsic", name: "string" })
  expect(params[0]?.default).toMatchObject({ name: "DocsReferenceButtonVariant" })

  const split = await api.loadSymbolByName("DocsReferenceSplitButtonProps")
  const extendsSyms = await split.loadExtendsSymbols()
  expect(extendsSyms.map((s) => s.getName()).sort()).toEqual([
    "DocsReferenceButtonProps",
    "DocsReferencePressableProps",
  ])

  const flattened = await api.graph.flattenInterfaceMembers(split)
  expect(flattened.map((m) => m.getName())).toEqual(expect.arrayContaining(["hasMenu", "label", "announceLabel"]))

  const refs = await api.graph.collectUserOwnedReferences(split)
  expect(refs.map((r) => r.getName()).sort()).toEqual(
    expect.arrayContaining(["DocsReferenceButtonProps", "DocsReferencePressableProps"])
  )
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-SNK-01",
  async verify({ api }) {
    await verifyKitchenSinkSymbols(api)
    await verifyKitchenSinkAliases(api)
    await verifyKitchenSinkStructures(api)
    await verifyKitchenSinkButtonProps(api)
    await verifyKitchenSinkInheritance(api)
  },
}

export default spec
