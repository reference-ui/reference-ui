import { css } from '@reference-ui/styled'

css({
  ...{ margin: '10px' },
  padding: '20px',
})

css({ color: 'red', ...(unk && { padding: '10px' }) })
css({ color: 'red', ...(unk || { margin: '20px' }) })
css({ color: 'red', ...(unk ? { padding: '10px' } : { padding: '20px' }) })
css({ color: 'red', ...(unk ? { padding: '10px' } : { margin: '20px' }) })
