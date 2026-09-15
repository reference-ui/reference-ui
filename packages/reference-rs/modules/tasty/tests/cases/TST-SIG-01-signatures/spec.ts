/**
 * Station specification for TST-SIG-01-signatures.
 * Verifies signature member metadata, callable/constructible types, and wrappers.
 * Proves primary SPEC ID anchor TST-SIG-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-SIG-01",
  async verify({ api }) {
    const readonlyProps = await api.loadSymbolByName("ReadonlyProps")
    const withMethod = await api.loadSymbolByName("WithMethod")
    const callable = await api.loadSymbolByName("Callable")
    const stringMap = await api.loadSymbolByName("StringMap")
    const constructible = await api.loadSymbolByName("Constructible")

    expect(findMember(readonlyProps, "id").isReadonly()).toBe(true)
    expect(findMember(readonlyProps, "id").isOptional()).toBe(false)
    expect(findMember(readonlyProps, "id").getKind()).toBe("property")
    expect(findMember(readonlyProps, "label").isOptional()).toBe(true)
    expect(findMember(withMethod, "getName").getKind()).toBe("method")
    expect(findMember(callable, "[call]").getKind()).toBe("call")
    expect(findMember(stringMap, "[index]").getKind()).toBe("index")
    expect(findMember(constructible, "[new]").getKind()).toBe("construct")

    const stringArray = await api.loadSymbolByName("StringArray")
    const namedPair = await api.loadSymbolByName("NamedPair")
    const mouseEventCtor = await api.loadSymbolByName("MouseEventCtor")
    const withCallback = await api.loadSymbolByName("WithCallback")

    expect(stringArray.getUnderlyingType()?.getKind()).toBe("array")
    expect(namedPair.getUnderlyingType()?.getKind()).toBe("tuple")
    expect(namedPair.getUnderlyingType()?.getRaw()).toMatchObject({
      elements: [{ label: "name" }, { label: "age" }],
    })
    expect(mouseEventCtor.getUnderlyingType()?.getKind()).toBe("constructor")
    expect((mouseEventCtor.getUnderlyingType()?.getRaw() as { abstract?: boolean }).abstract).toBe(false)

    const callbackType = findMember(withCallback, "onClick").getType()
    expect(callbackType?.getKind()).toBe("function")
    expect((callbackType?.getRaw() as { params?: Array<{ name?: string }> }).params?.[0]?.name).toBe("event")
    expect(callbackType?.describe()).toBe("function")
  },
}

export default spec
