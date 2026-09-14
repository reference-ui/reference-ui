/**
 * Station specification for TST-TUP-01-tuple-arrays.
 * Verifies labeled, optional, rest, and readonly tuple structures.
 * Proves primary SPEC ID anchor TST-TUP-01.
 */
import type { StationSpec } from "../../../testing/index.js"
import { expectUnderlyingKindOneOf, expectUnderlyingPresent, type TastyCaseResult } from "../../helpers.js"

const spec: StationSpec<TastyCaseResult> = {
  id: "TST-TUP-01",
  async verify({ api }) {
    const tupleLabeled = await api.loadSymbolByName("TupleLabeled")
    const tupleOptional = await api.loadSymbolByName("TupleOptional")
    const tupleRest = await api.loadSymbolByName("TupleRest")
    const tupleComplex = await api.loadSymbolByName("TupleComplex")
    const readonlyTuple = await api.loadSymbolByName("ReadonlyTuple")
    const constAssertion = await api.loadSymbolByName("ConstAssertion")

    for (const sym of [tupleLabeled, tupleOptional, tupleRest, tupleComplex]) {
      expectUnderlyingKindOneOf(sym, ["tuple"])
    }
    expectUnderlyingKindOneOf(readonlyTuple, ["tuple", "type_operator"])
    expectUnderlyingKindOneOf(constAssertion, ["tuple", "type_operator"])

    const arrayToTuple = await api.loadSymbolByName("ArrayToTuple")
    const tupleToArray = await api.loadSymbolByName("TupleToArray")
    const tupleHead = await api.loadSymbolByName("TupleHead")
    const tupleTail = await api.loadSymbolByName("TupleTail")

    expectUnderlyingPresent(arrayToTuple)
    expectUnderlyingPresent(tupleToArray)
    expectUnderlyingKindOneOf(tupleHead, ["conditional"])
    expectUnderlyingKindOneOf(tupleTail, ["conditional"])

    const examples = ["LabeledExample", "OptionalExample", "RestExample", "ReadonlyExample", "ConstExample", "ComplexExample", "ConversionExample"]
    for (const name of examples) {
      const sym = await api.loadSymbolByName(name)
      expectUnderlyingPresent(sym)
    }
  },
}

export default spec
