/**
 * Station specification for TST-TMP-02-template-literals-advanced.
 * Verifies complex template literal patterns, union explosions, and intrinsics.
 * Proves primary SPEC ID anchor TST-TMP-02.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { expectUnderlyingKindOneOf, expectUnderlyingPresent, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-TMP-02",
  async verify({ api }) {
    const templateLiteralMapped = await api.loadSymbolByName("TemplateLiteralMapped")
    const unionExplosion = await api.loadSymbolByName("TemplateLiteralUnionExplosion")
    const intrinsic = await api.loadSymbolByName("TemplateLiteralIntrinsic")

    expectUnderlyingKindOneOf(templateLiteralMapped, ["mapped"])
    expectUnderlyingKindOneOf(unionExplosion, ["union", "template_literal"])
    expectUnderlyingKindOneOf(intrinsic, ["object"])

    const symNames = ["GetterMapped", "RoutePaths", "CssClasses", "EventNames", "ApiEndpoints"]
    for (const name of symNames) {
      const sym = await api.loadSymbolByName(name)
      expectUnderlyingPresent(sym)
    }

    const exampleNames = ["GetterExample", "RouteExample", "CssExample", "EventExample", "ApiExample", "IntrinsicExample"]
    for (const name of exampleNames) {
      const sym = await api.loadSymbolByName(name)
      expectUnderlyingPresent(sym)
    }

    const intrinsicExample = await api.loadSymbolByName("IntrinsicExample")
    expect(intrinsicExample.getMembers().length).toBeGreaterThan(0)
  },
}

export default spec
