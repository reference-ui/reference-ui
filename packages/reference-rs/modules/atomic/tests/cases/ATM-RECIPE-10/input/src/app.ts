import { banner, card } from './card'

card({ size: { base: 'sm', md: 'lg' }, tone: 'loud', on: true })

export function pickBanner(size: 'sm' | 'lg') {
  return banner({ size })
}
