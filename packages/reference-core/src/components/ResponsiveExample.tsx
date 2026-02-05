import { Box } from '../system/jsx/box.js';

export function ResponsiveExample() {
  return (
    <div
      style={{
        containerType: 'inline-size',
        border: '2px solid #666',
        padding: '1rem',
        marginTop: '2rem',
        resize: 'horizontal',
        overflow: 'auto',
        maxWidth: '100%',
        minWidth: '200px',
      }}
    >
      <h2 style={{ margin: '0 0 1rem 0' }}>Resize this container</h2>
      <Box
        padding="2r"
        backgroundColor="#ef4444"
        color="white"
        r={{
          300: { padding: '4r', backgroundColor: '#22c55e' },
          500: { padding: '6r', backgroundColor: '#3b82f6' },
          700: { padding: '8r', backgroundColor: '#a855f7' },
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Responsive Box</h3>
        <p style={{ margin: 0 }}>Container-aware responsive design</p>
      </Box>
    </div>
  );
}
