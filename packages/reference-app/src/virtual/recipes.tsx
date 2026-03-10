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
    px: '5r',
    py: '2.5r',
    borderRadius: 'lg',
    fontWeight: '600',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  variants: {
    visual: {
      solid: {
        bg: 'teal.700',
        color: 'white',
        borderColor: 'teal.700',
      },
      outline: {
        bg: 'white',
        color: 'gray.900',
        borderColor: 'gray.300',
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
        color: 'pink.700',
        borderColor: 'pink.700',
        _hover: {
          bg: 'pink.50',
        },
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
