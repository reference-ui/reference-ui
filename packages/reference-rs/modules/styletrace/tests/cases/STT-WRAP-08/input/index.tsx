/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import * as React from 'react'
import { forwardRef, memo } from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

function CardBase(props: StyleProps) {
  return <Div {...props} />
}

export const Card = CardBase
export const MemoCard = React.memo(CardBase)
export const RefCard = React.forwardRef(CardBase)
export const ImportMemoCard = memo(CardBase)
export const ImportRefCard = forwardRef(CardBase)
export const NestedCard = memo(forwardRef(CardBase))

function PlainBase({ label }: { label: string }) {
  return <div>{label}</div>
}

export const PlainMemo = React.memo(PlainBase)
