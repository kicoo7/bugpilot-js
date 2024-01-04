"use client";
import {
  Component,
  ComponentType,
  ErrorInfo,
  PropsWithChildren,
  createElement,
} from "react";
import { ErrorBoundaryContext } from "./ErrorBoundaryContext";
import { FallbackComponent as BugpilotFallbackComponent } from "./ui/FallbackComponent";
import { captureError } from "../core";
import { getSessionContext } from "../context/getSessionContext";
import { hasArrayChanged } from "./utils";

type FallbackProps = {
  error: any;
  resetErrorBoundary: (...args: any[]) => void;
};

type ErrorBoundaryState =
  | {
      didCatch: true;
      error: any;
    }
  | {
      didCatch: false;
      error: null;
    };

type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent: ComponentType<FallbackProps>;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: (
    details:
      | { reason: "imperative-api"; args: any[] }
      | { reason: "keys"; prev: any[] | undefined; next: any[] | undefined }
  ) => void;
  resetKeys?: any[];
}>;

const initialState: ErrorBoundaryState = {
  didCatch: false,
  error: null,
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
    this.state = initialState;
  }

  static getDerivedStateFromError(error: Error) {
    return { didCatch: true, error };
  }

  resetErrorBoundary(...args: any[]) {
    const { error } = this.state;

    if (error !== null) {
      this.props.onReset?.({
        args,
        reason: "imperative-api",
      });

      this.setState(initialState);
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ) {
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
    const { didCatch, error } = this.state;

    let childToRender = children;

    if (didCatch === true) {
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
        },
      },
      childToRender
    );
  }
}

type BugpilotErrorBoundaryProps = ErrorBoundaryProps & {
  title: string;
  description: string;
};

export function BugpilotErrorBoundary({
  children,
  onReset = () => {},
  FallbackComponent = ({ resetErrorBoundary }) => (
    <BugpilotFallbackComponent
      resetErrorBoundary={resetErrorBoundary}
      title={title}
      description={description}
    />
  ),
  title = "Error",
  description = "We couldn't load your component at this time. Please try again.",
}: BugpilotErrorBoundaryProps) {
  function onError(error: Error) {
    const sessionContext = getSessionContext();
    captureError(error, { ...sessionContext, kind: "error-boundary" });
  }

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={onError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}
