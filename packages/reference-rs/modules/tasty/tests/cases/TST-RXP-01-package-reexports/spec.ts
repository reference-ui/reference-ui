/**
 * Station specification for TST-RXP-01-package-reexports.
 * Verifies external package type re-exports and canonical library symbols.
 * Proves primary SPEC ID anchor TST-RXP-01.
 */
import { expect } from "vitest"
import type { StationSpec } from "../../../testing/index.js"
import { findMember, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-RXP-01",
  async verify({ api }) {
    const usesExternalAliases = await api.loadSymbolByName("UsesExternalAliases")
    const jsonSchema = await api.loadSymbolByName("JSONSchema4")
    const cssProperties = await api.loadSymbolByName("Properties")

    const schemaMatches = await api.findSymbolsByName("JSONSchema4")
    const cssMatches = await api.findSymbolsByName("Properties")
    const aliasedCssMatches = await api.findSymbolsByName("CSSProperties")

    expect(api.getWarnings().some((warning) => warning.includes("Duplicate symbol name"))).toBe(false)
    expect(schemaMatches).toHaveLength(1)
    expect(cssMatches).toHaveLength(1)
    expect(aliasedCssMatches).toHaveLength(0)
    expect(jsonSchema.getLibrary()).toBe("json-schema")
    expect(cssProperties.getLibrary()).toBe("csstype")
    expect(cssProperties.getName()).toBe("Properties")

    const schemaType = findMember(usesExternalAliases, "schema").getType()?.getRaw() as {
      name?: string
      library?: string
    }
    const cssType = findMember(usesExternalAliases, "css").getType()?.getRaw() as {
      name?: string
      library?: string
    }

    expect(schemaType.name).toBe("JSONSchema4")
    expect(schemaType.library).toBe("json-schema")
    expect(cssType.name).toBe("Properties")
    expect(cssType.library).toBe("csstype")
  },
}

export default spec
