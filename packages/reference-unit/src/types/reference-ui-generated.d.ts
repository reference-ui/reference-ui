declare module '@reference-ui/react' {
  import type { ComponentType } from 'react'

  export const Div: ComponentType<any>
  export function css(...args: any[]): any
  export function recipe(...args: any[]): any
}

declare module '@reference-ui/system' {
  export function font(...args: any[]): any
  export function tokens(...args: any[]): any
  export function keyframes(...args: any[]): any
  export function globalCss(...args: any[]): any
}

declare module '../../../.reference-ui/system/baseSystem.mjs' {
  export const baseSystem: any
}
