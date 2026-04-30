import { cva } from 'src/system/css'
const __reference_ui_cva = cva;

const button = __reference_ui_cva({ base: { color: 'teal.600' } })
const nested = __reference_ui_cva({ variants: { size: { md: { padding: '4' } } } })