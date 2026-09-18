// Entry for the NEO-RECIPE-07 world. It takes a recipe config bound to
// an identifier and feeds it to recipe(), refusing the inline-literal rule.
// Sync must reject with the located refusal pointing at the call below.
import { recipe } from '@reference-ui/react'

const dyn = { className: 'dyn' }

export const a = recipe(dyn)
