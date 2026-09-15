/**
 * Station specification for TST-UNI-02-discriminated-unions.
 * Verifies discriminated union patterns, exhaustive switches, and handler signatures.
 * Proves primary SPEC ID anchor TST-UNI-02.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-UNI-02",
  async verify({ api }) {
    const discriminatedUnion = await api.loadSymbolByName("DiscriminatedUnion")
    const action = await api.loadSymbolByName("Action")
    const exhaustiveSwitch = await api.loadSymbolByName("ExhaustiveSwitch")
    const unionOfInterfaces = await api.loadSymbolByName("UnionOfInterfaces")
    const apiResponse = await api.loadSymbolByName("ApiResponse")
    const networkState = await api.loadSymbolByName("NetworkState")

    expect(discriminatedUnion.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "union" })
    expect(action.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "union" })
    expect(exhaustiveSwitch.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "conditional" })
    expect(unionOfInterfaces.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(apiResponse.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "union" })
    expect(networkState.getUnderlyingType()?.getRaw()).toMatchObject({ kind: "union" })

    const actionHandler = await api.loadSymbolByName("ActionHandler")
    const responseProcessor = await api.loadSymbolByName("ResponseProcessor")
    const networkReducer = await api.loadSymbolByName("NetworkReducer")
    const unionExtractor = await api.loadSymbolByName("UnionExtractor")

    expect(actionHandler.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(responseProcessor.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(networkReducer.getUnderlyingType()?.getRaw()).toBeDefined()
    expect(unionExtractor.getUnderlyingType()?.getRaw()).toBeDefined()

    expect(findMember(actionHandler, "handle").getType()?.getRaw()).toBeDefined()
    expect(findMember(actionHandler, "getUserActions").getType()?.getRaw()).toBeDefined()
  },
}

export default spec
