// Barrel-chain origin (SPEC-V2-57): three hops to the consumer. Builds a hex
// spelling so the folded value is valid CSS (`hop.red` would read as an
// unknown token path and warn).
export const hop = (hex: string): string => `#${hex}`
