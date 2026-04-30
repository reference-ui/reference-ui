import { cva } from 'src/system/css'

const button = cva({ base: { color: 'teal.600' } })
const nested = cva({ variants: { size: { md: { padding: '4' } } } })