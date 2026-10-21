import { recipe } from '@reference-ui/react'

export const stray = recipe({
  className: 'stray',
  slots: ['root', 'title'],
  base: { root: { display: 'flex' }, header: { color: 'red' } },
})

export const listless = recipe({ className: 'listless', slots: 'root' })

export const twice = recipe({ className: 'twice', slots: ['root', 'root'] })

export const empty = recipe({ className: 'empty', slots: [] })

export const card = recipe({ className: 'card', slots: ['root'], base: { root: { display: 'flex' } } })

export const cardRoot = recipe({ className: 'card__root', base: { display: 'block' } })

export const shared = recipe({ className: 'shared', slots: ['root'] })

export const sharedPlain = recipe({ className: 'shared', base: { display: 'grid' } })
