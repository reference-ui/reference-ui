// Re-export so tsc walks this file via the package entry. The actual type
// assertions live in `./strict-tokens.assertions`, which has no runtime exports.
import './strict-tokens.assertions'

export {}
