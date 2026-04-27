import { recipe } from '@reference-ui/react'

const button = recipe({
  base: {
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    borderRadius: '0.25rem',
  },
})

const card = recipe({
  base: {
    padding: '1rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
})

export const showcaseRecipe = recipe({
  base: {
    padding: '5r',
    borderRadius: '12px',
    fontWeight: '600',
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: 'fixtureDemoAccent',
        color: 'white',
      },
      outline: {
        backgroundColor: 'fixtureDemoText',
        color: 'fixtureDemoBg',
      },
    },
    tone: {
      teal: {},
      pink: {},
    },
  },
  compoundVariants: [
    {
      visual: 'outline',
      tone: 'pink',
      css: {
        backgroundColor: 'referenceUnitToken',
        color: 'white',
      },
    },
  ],
  defaultVariants: {
    visual: 'solid',
    tone: 'teal',
  },
})

export const Button = () => <button className={button()}>Click</button>
export const Card = () => <div className={card()}>Card</div>
export const ShowcaseButton = () => (
  <button className={showcaseRecipe({ visual: 'outline', tone: 'pink' })}>Showcase</button>
)
