import { Link } from '@tanstack/react-router';
import { Aside, H2, Nav, Div } from '@reference-ui/core';
import { docsBySection } from '../../lib/docs';

export function DocSidebar() {
  return (
    <Aside
      width="240px"
      flexShrink="0"
      padding="4r"
      borderRightColor="gray.200"
      borderRight="1px solid"
      css={{
        position: 'fixed',
        top: 0,
        left: 'calc((100vw - 90ex) / 2 - 240px)',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      <H2 margin="0 0 1rem" fontSize="6r" fontWeight="600">
        Reference UI
      </H2>
      <Nav>
        {Object.entries(docsBySection).map(([section, items]) => (
          <Div key={section}>
            <Div
              fontSize="0.6875rem"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              color="gray.500"
              marginTop="1rem"
              marginBottom="0.5rem"
            >
              {section}
            </Div>
            {items.map(({ slug, title }) => (
              <Link
                key={slug}
                to={slug === 'intro' ? '/' : '/$slug'}
                params={slug === 'intro' ? undefined : { slug }}
                style={{
                  display: 'block',
                  padding: '0.375rem 0',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                activeProps={{ style: { color: '#2563eb' } }}
              >
                {title}
              </Link>
            ))}
          </Div>
        ))}
      </Nav>
    </Aside>
  );
}
