export const majors = ['17', '18', '19'] as const

export type Major = (typeof majors)[number]

export const defaultMajor: Major = '19'

function isMajor(value: string): value is Major {
  return (majors as readonly string[]).includes(value)
}

export function resolveMajor(env: NodeJS.ProcessEnv = process.env): Major {
  const raw = env.CT_REACT
  const major = String(raw || defaultMajor).trim().replace(/^react/i, '')
  if (isMajor(major)) return major
  throw new Error(`Unknown CT React major "${raw}". Use ${majors.join(', ')}.`)
}

export function isDefaultMajor(major = resolveMajor()) {
  return major === defaultMajor
}
