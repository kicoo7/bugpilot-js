"use client";
import React, { Component, createElement } from "react";
import { useBugpilot } from "./Bugpilot.mjs";
import { ErrorBoundaryContext } from "./ErrorBoundaryContext.mjs";
import { hasArrayChanged } from "./utils.mjs";
import { FallbackComponent as BugpilotFallbackComponent } from "./components/FallbackComponent.mjs";

// Start react-error-boundary
const initialState = {
  didCatch: false,
  error: null,
  isHandled: false,
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
    this.state = initialState;
  }

  static getDerivedStateFromError(error) {
    // Simone: this is the case we want to "handle the error" and just show and error message
    if (error?.message?.includes("BugpilotError") === true) {
      return { didCatch: true, error, isHandled: true };
    }
    return { didCatch: true, error, isHandled: false };
  }

  resetErrorBoundary(...args) {
    const { error } = this.state;

    if (error !== null) {
      this.props.onReset?.({
        args,
        reason: "imperative-api",
      });

      this.setState(initialState);
    }
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps, prevState) {
    const { didCatch } = this.state;
    const { resetKeys } = this.props;

    // There's an edge case where if the thing that triggered the error happens to *also* be in the resetKeys array,
    // we'd end up resetting the error boundary immediately.
    // This would likely trigger a second error to be thrown.
    // So we make sure that we don't check the resetKeys on the first call of cDU after the error is set.

    if (
      didCatch &&
      prevState.error !== null &&
      hasArrayChanged(prevProps.resetKeys, resetKeys)
    ) {
      this.props.onReset?.({
        next: resetKeys,
        prev: prevProps.resetKeys,
        reason: "keys",
      });

      this.setState(initialState);
    }
  }

  render() {
    const { children, FallbackComponent } = this.props;
    const { didCatch, error, isHandled } = this.state;

    let childToRender = children;

    if (didCatch === true && isHandled === false) {
      const props = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      };

      if (FallbackComponent) {
        childToRender = createElement(FallbackComponent, props);
      } else {
        throw error;
      }
    }

    return createElement(
      ErrorBoundaryContext.Provider,
      {
        value: {
          didCatch,
          error,
          resetErrorBoundary: this.resetErrorBoundary,
          isHandled,
        },
      },
      childToRender
    );
  }
}

// End react-error-boundary

export function BugpilotErrorBoundary({
  children,
  onReset = () => {},
  FallbackComponent = ({ error, resetErrorBoundary }) => (
    <BugpilotFallbackComponent
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      title={title}
      description={description}
    />
  ),
  title = "Error",
  description = "We couldn't load your component at this time. Please try again.",
}) {
  const { saveBugReport } = useBugpilot();

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={saveBugReport}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}
