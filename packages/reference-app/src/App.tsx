import { Div, Container, ResponsiveExample, Button } from '@reference-ui/core';
import '@reference-ui/core/styles.css';

export default function App() {
  return (
    <Container style={{ padding: '2rem' }}>
      <h1>Reference UI - React First</h1>
      <ResponsiveExample />
      <div style={{ marginTop: '2rem' }}>
        <Button>Design system button</Button>

        <Div padding="10r" bg="green.500">
          Hello
        </Div>
      </div>
    </Container>
  );
}
