/**
 * Station specification for TST-STY-02-style-props-projection.
 * Verifies projection of style-props alias chains and enhanced type descriptions.
 * Proves primary SPEC ID anchor TST-STY-02.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import type { TastyCaseResult } from "../../helpers.js"

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((m) => m.getName())
}

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-STY-02",
  async verify({ api }) {
    const systemStyle = await api.loadSymbolByName("SystemStyleObject")
    const styleProps = await api.loadSymbolByName("ReferenceSystemStyleObject")
    const publicStyleProps = await api.loadSymbolByName("PublicReferenceSystemStyleObject")

    const systemMembers = await systemStyle.getDisplayMembers()
    const styleMembers = await styleProps.getDisplayMembers()
    const publicMembers = await publicStyleProps.getDisplayMembers()

    expect(memberNames(systemMembers)).toEqual(["color", "font", "weight", "container", "--accent", "[index]"])
    expect(memberNames(styleMembers)).toEqual(["color", "--accent", "[index]", "container", "r", "font", "weight"])
    expect(memberNames(publicMembers)).toEqual(["color", "--accent", "[index]", "container", "r", "font", "weight"])
    expect(styleProps.getMembers()).toEqual([])
    expect(publicStyleProps.getMembers()).toEqual([])
    expect(styleProps.getUnderlyingType()?.describe()).toBe(
      "Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceBoxPatternProps"
    )

    const containerMember = publicMembers?.find((m) => m.getName() === "container")
    const rMember = publicMembers?.find((m) => m.getName() === "r")
    expect(containerMember?.getType()?.describe()).toContain("ConditionalValue")
    expect(rMember?.getType()?.describe()).toContain("Record")
    expect(containerMember?.getType()?.describe()).not.toBe("{ ... }")
  },
}

export default spec
