// The one clean file in the CORE-DIAG-51 world. It takes no inputs and emits
// an exported Ok interface with a single string field. The scan failure
// comes from the spec's invalid glob, not this file, so the tasty build must
// refuse the request with TST-E-SCAN-FAILED.
export interface Ok {
  a: string
}
