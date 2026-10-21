import { recipe } from '@reference-ui/react'

export const card = recipe({
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: {
    root: { display: 'flex' },
    title: { fontWeight: '600' },
  },
  variants: {
    size: {
      sm: { root: { padding: '12px' }, title: { fontSize: '14px' } },
      lg: { root: { padding: '24px' }, title: { fontSize: '20px' } },
    },
    tone: {
      quiet: { root: { backgroundColor: 'white' } },
      loud: { root: { backgroundColor: 'black' }, title: { color: 'white' } },
    },
    on: {
      true: { body: { opacity: '1' } },
      false: { body: { opacity: '0.5' } },
    },
  },
  defaultVariants: { size: 'sm', tone: 'quiet', on: false },
  compoundVariants: [{ size: 'lg', tone: 'loud', css: { title: { letterSpacing: '1px' } } }],
})

export const banner = recipe({
  className: 'banner',
  slots: ['root', 'icon'],
  base: { root: { display: 'grid' } },
  variants: {
    size: {
      sm: { icon: { width: '16px' } },
      lg: { icon: { width: '32px' } },
    },
  },
})

export const panel = recipe({
  className: 'panel',
  slots: ['root'],
  base: { root: { display: 'block' } },
})
