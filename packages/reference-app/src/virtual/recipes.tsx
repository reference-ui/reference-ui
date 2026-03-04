import { recipe } from '@reference-ui/react'

const button = recipe({ base: 'px-4 py-2 rounded' })
const card = recipe({ base: 'p-4 shadow' })

export const Button = () => <button className={button()}>Click</button>
export const Card = () => <div className={card()}>Card</div>
