import { Link } from '@tanstack/react-router';
import { docsBySection } from '../../lib/docs';

export function DocSidebar() {
  return (
    <aside
      style={{
        width: 220,
        padding: '1.5rem 1rem',
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
      }}
    >
      <h2 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
        Reference UI
      </h2>
      <nav>
        {Object.entries(docsBySection).map(([section, items]) => (
          <div key={section}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginTop: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              {section}
            </div>
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
