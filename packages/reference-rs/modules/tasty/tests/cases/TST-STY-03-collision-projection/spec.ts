/**
 * Station specification for TST-STY-03-collision-projection.
 * Verifies public projections in the presence of local name collisions.
 * Proves primary SPEC ID anchor TST-STY-03.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((m) => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-STY-03",
  async verify({ api }) {
    const matches = await api.findSymbolsByName("StyleProps")
    const publicStyleProps = await api.loadSymbolByName("PublicStyleProps")
    const usesPublicStyleProps = await api.loadSymbolByName("UsesPublicStyleProps")

    expect(matches).toHaveLength(3)
    expect(matches.map((s) => s.library)).toEqual(["user", "user", "user"])
    expect(memberNames(await publicStyleProps.getDisplayMembers())?.sort()).toEqual([
      "color",
      "container",
      "display",
      "font",
      "r",
      "weight",
    ])
    expect(publicStyleProps.getMembers()).toEqual([])
    expect(findMember(usesPublicStyleProps, "style").getType()?.describe()).toBe("PublicStyleProps")
    expect(api.getWarnings().some((w) => w.includes("Duplicate symbol name \"StyleProps\""))).toBe(true)

    await expect(api.loadSymbolByName("StyleProps")).rejects.toThrow("Ambiguous symbol name \"StyleProps\"")
    await expect(api.loadSymbolByScopedName("user", "StyleProps")).rejects.toThrow(
      "Ambiguous symbol name \"StyleProps\" within library \"user\""
    )
  },
}

export default spec
