/**
 * Station specification for TST-PRJ-02-recursive-projection.
 * Verifies projection of recursive type aliases and interface structures.
 * Proves primary SPEC ID anchor TST-PRJ-02.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import type { TastyCaseResult } from "../../helpers.js"

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((m) => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-PRJ-02",
  async verify({ api }) {
    const nested = await api.loadSymbolByName("Nested")
    const systemStyle = await api.loadSymbolByName("SystemStyleObject")
    const publicSystemStyle = await api.loadSymbolByName("PublicSystemStyleObject")

    const nestedMembers = await nested.getDisplayMembers()
    const systemStyleMembers = await systemStyle.getDisplayMembers()
    const publicMembers = await publicSystemStyle.getDisplayMembers()

    expect(memberNames(nestedMembers)).toEqual(["[index]"])
    expect(memberNames(systemStyleMembers)).toEqual(["color", "--accent", "[index]", "gap"])
    expect(memberNames(publicMembers)).toEqual(["color", "--accent", "[index]", "gap"])
    expect(systemStyle.getMembers()).toEqual([])
    expect(publicSystemStyle.getMembers()).toEqual([])
  },
}

export default spec
