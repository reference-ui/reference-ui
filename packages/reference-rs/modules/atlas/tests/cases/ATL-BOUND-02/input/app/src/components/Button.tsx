import * as React from 'react'
export interface ButtonProps { variant?: 'solid' | 'ghost' }
export function Button(props: ButtonProps): React.ReactElement { return <button data-variant={props.variant} /> }
