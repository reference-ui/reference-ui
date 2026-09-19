declare const flag: boolean
declare const left: string

export const cond = { color: flag ? 'red' : 'blue' }
export const fallback = { color: left ?? 'cyan' }
