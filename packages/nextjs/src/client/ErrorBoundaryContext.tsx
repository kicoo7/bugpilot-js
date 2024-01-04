import { createContext } from "react";
export const ErrorBoundaryContext = createContext({
  error: null,
  resetErrorBoundary: () => {},
  didCatch: false,
});
