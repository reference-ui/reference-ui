/**
 * Station specification for TST-STY-04-key-alias-projection.
 * Verifies omit key projections through aliased literal unions.
 * Proves primary SPEC ID anchor TST-STY-04.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import type { TastyCaseResult } from "../../helpers.js"

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((m) => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-STY-04",
  async verify({ api }) {
    const narrowedStyle = await api.loadSymbolByName("NarrowedStyleObject")
    const publicStyleProps = await api.loadSymbolByName("PublicStyleProps")

    const narrowedMembers = await narrowedStyle.getDisplayMembers()
    const publicMembers = await publicStyleProps.getDisplayMembers()

    expect(memberNames(narrowedMembers)).toEqual(["color", "padding", "font", "container", "r"])
    expect(memberNames(publicMembers)).toEqual(["color", "padding", "container", "r"])
    expect(narrowedStyle.getMembers()).toEqual([])
    expect(publicStyleProps.getMembers()).toEqual([])
  },
}

export default spec
