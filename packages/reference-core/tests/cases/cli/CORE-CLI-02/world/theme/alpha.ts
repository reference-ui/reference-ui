// Alpha theme input for the CORE-CLI-02 world. It takes no inputs and emits
// an exported Shared interface carrying the alpha string field. Nothing
// imports it; it rides the world's theme include glob as a scanned source.
export interface Shared {
  alpha: string
}
