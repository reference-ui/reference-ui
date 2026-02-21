import { useState } from 'react'
import { Div } from '../primitives/index.js'
import { recipe } from '../styled/api/runtime/recipe.js'

/**
 * Demo component showcasing the recipe() API from reference-core.
 * Tests that the parser transforms recipe() → cva() for Panda.
 */

// Define a polished button recipe with variants
const buttonRecipe = recipe({
  base: {
    px: '5r',
    py: '2.5r',
    borderRadius: 'lg',
    fontWeight: '600',
    fontSize: 'sm',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    _hover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    _active: {
      transform: 'translateY(0)',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
  },
  variants: {
    visual: {
      solid: {
        bg: 'blue.600',
        color: 'white',
        _hover: { bg: 'blue.700' },
        _active: { bg: 'blue.800' },
      },
      outline: {
        bg: 'white',
        color: 'blue.700',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'blue.300',
        _hover: {
          bg: 'blue.50',
          borderColor: 'blue.400',
        },
        _active: { bg: 'blue.100' },
      },
      ghost: {
        bg: 'transparent',
        color: 'blue.700',
        boxShadow: 'none',
        _hover: {
          bg: 'blue.50',
          boxShadow: 'none',
        },
        _active: { bg: 'blue.100' },
      },
    },
    size: {
      sm: {
        px: '3.5r',
        py: '1.75r',
        fontSize: 'xs',
      },
      md: {
        px: '5r',
        py: '2.5r',
        fontSize: 'sm',
      },
      lg: {
        px: '7r',
        py: '3.5r',
        fontSize: 'md',
      },
    },
    colorScheme: {
      blue: {},
      purple: {
        bg: 'purple.600',
        _hover: { bg: 'purple.700' },
        _active: { bg: 'purple.800' },
      },
      green: {
        bg: 'green.600',
        _hover: { bg: 'green.700' },
        _active: { bg: 'green.800' },
      },
      red: {
        bg: 'red.600',
        _hover: { bg: 'red.700' },
        _active: { bg: 'red.800' },
      },
    },
  },
  compoundVariants: [
    {
      visual: 'outline',
      colorScheme: 'purple',
      css: {
        borderColor: 'purple.300',
        color: 'purple.700',
        _hover: {
          bg: 'purple.50',
          borderColor: 'purple.400',
        },
      },
    },
    {
      visual: 'outline',
      colorScheme: 'green',
      css: {
        borderColor: 'green.300',
        color: 'green.700',
        _hover: {
          bg: 'green.50',
          borderColor: 'green.400',
        },
      },
    },
    {
      visual: 'outline',
      colorScheme: 'red',
      css: {
        borderColor: 'red.300',
        color: 'red.700',
        _hover: {
          bg: 'red.50',
          borderColor: 'red.400',
        },
      },
    },
    {
      visual: 'ghost',
      colorScheme: 'purple',
      css: {
        color: 'purple.700',
        _hover: { bg: 'purple.50' },
      },
    },
    {
      visual: 'ghost',
      colorScheme: 'green',
      css: {
        color: 'green.700',
        _hover: { bg: 'green.50' },
      },
    },
    {
      visual: 'ghost',
      colorScheme: 'red',
      css: {
        color: 'red.700',
        _hover: { bg: 'red.50' },
      },
    },
  ],
  defaultVariants: {
    visual: 'solid',
    size: 'md',
    colorScheme: 'blue',
  },
})

const DemoSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Div>
    <Div fontSize="md" fontWeight="600" color="gray.700" mb="3r" letterSpacing="-0.5px">
      {title}
    </Div>
    {children}
  </Div>
)

export function RecipeCoreDemo() {
  const [count, setCount] = useState(0)

  return (
    <Div
      display="flex"
      flexDirection="column"
      gap="8r"
      p="8r"
      bg="gray.50"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
    >
      <DemoSection title="Visual Variants">
        <Div display="flex" gap="3r" flexWrap="wrap">
          <button className={buttonRecipe({ visual: 'solid' })}>Solid</button>
          <button className={buttonRecipe({ visual: 'outline' })}>Outline</button>
          <button className={buttonRecipe({ visual: 'ghost' })}>Ghost</button>
        </Div>
      </DemoSection>

      <DemoSection title="Size Variants">
        <Div display="flex" gap="3r" flexWrap="wrap" alignItems="center">
          <button className={buttonRecipe({ size: 'sm' })}>Small</button>
          <button className={buttonRecipe({ size: 'md' })}>Medium</button>
          <button className={buttonRecipe({ size: 'lg' })}>Large</button>
        </Div>
      </DemoSection>

      <DemoSection title="Color Schemes">
        <Div display="flex" gap="3r" flexWrap="wrap">
          <button className={buttonRecipe({ colorScheme: 'blue' })}>Blue</button>
          <button className={buttonRecipe({ colorScheme: 'purple' })}>Purple</button>
          <button className={buttonRecipe({ colorScheme: 'green' })}>Green</button>
          <button className={buttonRecipe({ colorScheme: 'red' })}>Red</button>
        </Div>
      </DemoSection>

      <DemoSection title="Compound Variants">
        <Div display="flex" gap="3r" flexWrap="wrap">
          <button
            className={buttonRecipe({
              visual: 'outline',
              colorScheme: 'purple',
            })}
          >
            Purple Outline
          </button>
          <button className={buttonRecipe({ visual: 'outline', colorScheme: 'red' })}>
            Red Outline
          </button>
          <button className={buttonRecipe({ visual: 'ghost', colorScheme: 'green' })}>
            Green Ghost
          </button>
        </Div>
      </DemoSection>

      <DemoSection title="Interactive Example">
        <Div
          display="flex"
          gap="3r"
          alignItems="center"
          p="5r"
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
        >
          <button
            className={buttonRecipe({
              visual: 'solid',
              size: 'md',
              colorScheme: 'blue',
            })}
            onClick={() => setCount(c => c + 1)}
          >
            Clicked {count} times
          </button>
          <button
            className={buttonRecipe({
              visual: 'outline',
              size: 'sm',
              colorScheme: 'blue',
            })}
            onClick={() => setCount(0)}
          >
            Reset
          </button>
          <Div fontSize="sm" color="gray.600" ml="2r">
            Click the button to test interactivity
          </Div>
        </Div>
      </DemoSection>
    </Div>
  )
}
