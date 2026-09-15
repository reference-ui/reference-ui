/**
 * Station specification for TST-UNI-01-unions-literals.
 * Verifies union structures, literal types, and optional property handling.
 * Proves primary SPEC ID anchor TST-UNI-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-UNI-01",
  async verify({ api }) {
    const status = await api.loadSymbolByName("Status")
    const stringOrNumber = await api.loadSymbolByName("StringOrNumber")
    const optionalProps = await api.loadSymbolByName("OptionalProps")
    const bigintAlias = await api.loadSymbolByName("BigintAlias")

    const statusRaw = status.getUnderlyingType()?.getRaw() as {
      kind?: string
      types?: Array<{ kind?: string; value?: string }>
    }
    expect(statusRaw.kind).toBe("union")
    expect(statusRaw.types?.some((item) => item.kind === "literal")).toBe(true)

    const stringOrNumberRaw = stringOrNumber.getUnderlyingType()?.getRaw() as {
      kind?: string
      types?: unknown[]
    }
    expect(stringOrNumberRaw.kind).toBe("union")
    expect(stringOrNumberRaw.types).toHaveLength(2)

    expect(bigintAlias.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "intrinsic", name: "bigint" })
    expect(findMember(optionalProps, "name").isOptional()).toBe(false)
    expect(findMember(optionalProps, "description").isOptional()).toBe(true)
    expect(findMember(optionalProps, "count").isOptional()).toBe(true)
  },
}

export default spec
