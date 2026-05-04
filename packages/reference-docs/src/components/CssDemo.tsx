import { useState } from 'react'
import { Div, css } from '@reference-ui/react'

/**
 * Demo component showcasing the css() API.
 * Tests style object composition, responsive values, and design tokens.
 */

export function CssDemo() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Div bg="docsPageBg" display="flex" flexDirection="column" gap="10r">
      {/* Basic Usage */}
      <Div>
        <Div fontSize="xl" fontWeight="700" mb="4r" color="docsHeading">
          Basic CSS Styles
        </Div>
        <Div
          display="flex"
          flexDirection="column"
          gap="6r"
          p="8r"
          bg="docsDemoMutedBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="docsPanelBorder"
        >
          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Simple box with css()
            </Div>
            <div
              className={css({
                padding: '4r',
                bg: 'pink.500',
                color: 'gray.50',
                borderRadius: 'md',
                fontWeight: '600',
              })}
            >
              Styled with css() function
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Using design tokens
            </Div>
            <div
              className={css({
                padding: '3r',
                bg: 'purple.100',
                color: 'purple.800',
                borderRadius: 'lg',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'purple.300',
              })}
            >
              Purple themed box
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Typography styles
            </Div>
            <div
              className={css({
                fontSize: '2xl',
                fontWeight: '700',
                color: 'docsText',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              })}
            >
              Large Heading
            </div>
            <div
              className={css({
                fontSize: 'sm',
                color: 'docsMuted',
                lineHeight: '1.6',
                mt: '2r',
              })}
            >
              Supporting text with a comfortable line height for readability.
            </div>
          </div>
        </Div>
      </Div>

      {/* Responsive Styles */}
      <Div>
        <Div fontSize="xl" fontWeight="700" mb="4r" color="docsHeading">
          Responsive Styles
        </Div>
        <Div
          display="flex"
          flexDirection="column"
          gap="6r"
          p="8r"
          bg="docsDemoMutedBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="docsPanelBorder"
        >
          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Responsive padding (resize browser)
            </Div>
            <div
              className={css({
                padding: '6r',
                bg: 'green.500',
                color: 'gray.50',
                borderRadius: 'md',
                textAlign: 'center',
              })}
            >
              Padding 6r (responsive styles work with JSX props)
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Responsive layout
            </Div>
            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '3r',
                '@media (min-width: 768px)': {
                  flexDirection: 'row',
                },
              })}
            >
              <div
                className={css({
                  flex: '1',
                  padding: '4r',
                  bg: 'pink.200',
                  borderRadius: 'md',
                  textAlign: 'center',
                })}
              >
                Box 1
              </div>
              <div
                className={css({
                  flex: '1',
                  padding: '4r',
                  bg: 'pink.300',
                  borderRadius: 'md',
                  textAlign: 'center',
                })}
              >
                Box 2
              </div>
              <div
                className={css({
                  flex: '1',
                  padding: '4r',
                  bg: 'pink.400',
                  borderRadius: 'md',
                  textAlign: 'center',
                })}
              >
                Box 3
              </div>
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Responsive typography
            </Div>
            <div
              className={css({
                fontSize: '4xl',
                fontWeight: '700',
                color: 'docsText',
              })}
            >
              Large Text
            </div>
          </div>
        </Div>
      </Div>

      {/* Pseudo States */}
      <Div>
        <Div fontSize="xl" fontWeight="700" mb="4r" color="docsHeading">
          Interactive States
        </Div>
        <Div
          display="flex"
          flexDirection="column"
          gap="6r"
          p="8r"
          bg="docsDemoMutedBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="docsPanelBorder"
        >
          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Hover effects
            </Div>
            <button
              className={css({
                padding: '3r 6r',
                bg: 'blue.600',
                color: 'gray.50',
                borderRadius: 'md',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                _hover: {
                  bg: 'blue.700',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                _active: {
                  transform: 'translateY(0)',
                },
              })}
            >
              Hover Me
            </button>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Focus states
            </Div>
            <input
              type="text"
              placeholder="Focus me"
              className={css({
                padding: '3r',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'docsPanelBorder',
                borderRadius: 'md',
                fontSize: 'md',
                outline: 'none',
                transition: 'all 0.2s',
                _focus: {
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                },
              })}
            />
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Conditional styling
            </Div>
            <button
              type="button"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={css({
                padding: '4r',
                bg: isHovered ? 'orange.400' : 'orange.100',
                color: isHovered ? 'gray.50' : 'orange.900',
                borderRadius: 'md',
                transition: 'all 0.3s',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: '600',
                border: 'none',
                width: '100%',
              })}
            >
              {isHovered ? 'You are hovering!' : 'Hover over me'}
            </button>
          </div>
        </Div>
      </Div>

      {/* Advanced Composition */}
      <Div>
        <Div fontSize="xl" fontWeight="700" mb="4r" color="docsHeading">
          Style Composition
        </Div>
        <Div
          display="flex"
          flexDirection="column"
          gap="6r"
          p="8r"
          bg="docsDemoMutedBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="docsPanelBorder"
        >
          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Layering and shadows
            </Div>
            <div
              className={css({
                position: 'relative',
                padding: '6r',
                bg: 'docsDemoMutedBg',
                borderRadius: 'lg',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                _before: {
                  content: '""',
                  position: 'absolute',
                  inset: '0',
                  bg: 'gradient-to-br',
                  gradientFrom: 'blue.100',
                  gradientTo: 'purple.100',
                  borderRadius: 'lg',
                  opacity: '0.5',
                  zIndex: '-1',
                },
              })}
            >
              <Div fontSize="lg" fontWeight="700" color="docsText">
                Card with gradient backdrop
              </Div>
              <Div fontSize="sm" color="docsMuted" mt="2r">
                Using pseudo-elements for layered effects
              </Div>
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Grid layout
            </Div>
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '4r',
              })}
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <div
                  key={num}
                  className={css({
                    padding: '4r',
                    bg: 'indigo.100',
                    borderRadius: 'md',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: 'indigo.700',
                  })}
                >
                  Item {num}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Div fontSize="sm" fontWeight="600" mb="2r" color="docsMuted">
              Flexbox alignment
            </Div>
            <div
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4r',
                bg: 'teal.50',
                borderRadius: 'md',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'teal.200',
              })}
            >
              <Div fontSize="md" fontWeight="600" color="teal.900">
                Flex container
              </Div>
              <div
                className={css({
                  display: 'flex',
                  gap: '2r',
                })}
              >
                <button
                  className={css({
                    padding: '2r 4r',
                    bg: 'teal.600',
                    color: 'gray.50',
                    borderRadius: 'md',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'sm',
                    fontWeight: '600',
                  })}
                >
                  Action 1
                </button>
                <button
                  className={css({
                    padding: '2r 4r',
                    bg: 'teal.700',
                    color: 'gray.50',
                    borderRadius: 'md',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'sm',
                    fontWeight: '600',
                  })}
                >
                  Action 2
                </button>
              </div>
            </div>
          </div>
        </Div>
      </Div>
    </Div>
  )
}
