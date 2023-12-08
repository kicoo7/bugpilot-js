"use client";
import { useContext, useMemo, useState } from "react";
import { ErrorBoundaryContext } from "./ErrorBoundaryContext.mjs";

function assertErrorBoundaryContext(value) {
  if (
    value == null ||
    typeof value.didCatch !== "boolean" ||
    typeof value.resetErrorBoundary !== "function"
  ) {
    throw new Error("ErrorBoundaryContext not found");
  }
}

export function useBugpilotErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);

  assertErrorBoundaryContext(context);

  const [state, setState] = useState({
    error: null,
    hasError: false,
  });

  const memoized = useMemo(
    () => ({
      resetBoundary: () => {
        context.resetErrorBoundary();
        setState({ error: null, hasError: false });
      },
      showBoundary: (error) =>
        setState({
          error,
          hasError: true,
        }),
    }),
    [context.resetErrorBoundary]
  );

  if (state.hasError) {
    throw state.error;
  }

  return memoized;
}
