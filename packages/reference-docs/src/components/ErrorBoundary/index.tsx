import React from 'react';
import { Div, H2, P, Pre } from '@reference-ui/core';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Div padding="2rem" fontFamily="mono" whiteSpace="pre-wrap">
          <H2>Error</H2>
          <P>{this.state.error.message}</P>
          <Pre>{this.state.error.stack}</Pre>
        </Div>
      );
    }
    return this.props.children;
  }
}
