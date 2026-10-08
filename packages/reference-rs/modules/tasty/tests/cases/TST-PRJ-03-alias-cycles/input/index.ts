export type CyclicAlpha = CyclicBeta & {
  alphaLocal?: string
}

export type CyclicBeta = CyclicAlpha & {
  betaLocal?: string
}
