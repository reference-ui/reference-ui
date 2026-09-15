import { sva } from '@reference-ui/styled'

const alert = sva({
  slots: ['root', 'icon'],
  base: {
    root: { padding: '4r', borderRadius: 'md' },
    icon: { color: 'green' },
  },
})
void alert
