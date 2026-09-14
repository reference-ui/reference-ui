/**
 * Station specification for TST-RXP-02-reexport-edges.
 * Verifies complex re-export edge cases, barrels, and circular references.
 * Proves primary SPEC ID anchor TST-RXP-02.
 */
import type { StationSpec } from "../../../testing/index.js"
import { expectUnderlyingPresent, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-RXP-02",
  async verify({ api }) {
    const foo = await api.loadSymbolByName("Foo")
    const reexportTypeOnly = await api.loadSymbolByName("ReexportTypeOnly")
    const reexportMixed = await api.loadSymbolByName("ReexportMixed")
    const ambientModule = await api.loadSymbolByName("AmbientModule")

    for (const sym of [foo, reexportTypeOnly, reexportMixed, ambientModule]) {
      expectUnderlyingPresent(sym)
    }

    const reexportMixedType = await api.loadSymbolByName("ReexportMixedType")
    const barrelDeepItem = await api.loadSymbolByName("BarrelDeepItem")
    const circularItem = await api.loadSymbolByName("CircularItem")
    const starSourceItem = await api.loadSymbolByName("StarSourceItem")

    for (const sym of [reexportMixedType, barrelDeepItem, circularItem, starSourceItem]) {
      expectUnderlyingPresent(sym)
    }
  },
}

export default spec
