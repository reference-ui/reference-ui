function sva(config: unknown) {
  return config
}

function tw(styles: unknown) {
  return styles
}

function cx(styles: unknown) {
  return styles
}

const alert = sva({
  slots: ['root', 'icon'],
  base: {
    root: { padding: '4r', borderRadius: 'md' },
    icon: { color: 'green' },
  },
})

const spacing = tw({ mt: '2r', p: '1r' })
cx({ color: 'red', bg: 'n300' })

void alert
void spacing
