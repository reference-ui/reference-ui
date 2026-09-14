/**
 * Station specification for TST-PRJ-01-object-projection.
 * Verifies object-like projection over interface and alias chains.
 * Proves primary SPEC ID anchor TST-PRJ-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import type { TastyCaseResult } from "../../helpers.js"

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((m) => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-PRJ-01",
  async verify({ api }) {
    const base = await api.loadSymbolByName("BaseStyleProps")
    const objectAlias = await api.loadSymbolByName("ObjectAliasProps")
    const projected = await api.loadSymbolByName("ProjectedStyleProps")
    const publicProjected = await api.loadSymbolByName("PublicProjectedStyleProps")
    const unprojectable = await api.loadSymbolByName("UnprojectableStyleProps")

    const baseMembers = await base.getDisplayMembers()
    const objectAliasMembers = await objectAlias.getDisplayMembers()
    const projectedMembers = await projected.getDisplayMembers()
    const publicProjectedMembers = await publicProjected.getDisplayMembers()
    const unprojectableMembers = await unprojectable.getDisplayMembers()

    expect(memberNames(baseMembers)).toEqual(["tone", "color", "size"])
    expect(memberNames(objectAliasMembers)).toEqual(["radius"])
    expect(memberNames(projectedMembers)).toEqual(["tone", "size", "gap", "display"])
    expect(memberNames(publicProjectedMembers)).toEqual(["tone", "size", "gap", "display"])
    expect(memberNames(unprojectableMembers)).toEqual(["gap"])
    expect(projected.getMembers()).toEqual([])
    expect(publicProjected.getMembers()).toEqual([])
  },
}

export default spec
