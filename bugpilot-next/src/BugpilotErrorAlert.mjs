"use client";
import { useContext } from "react";
import { AlertDescription, Alert } from "./components/Alert.mjs";
import { ErrorBoundaryContext } from "./ErrorBoundaryContext.mjs";

export function BugpilotErrorAlert() {
  const {
    error = null,
    didCatch = false,
    isHandled = false,
  } = useContext(ErrorBoundaryContext);

  // Simo: How can I render my custom error message?

  // remove BugpilotError: from error.message
  const cleanErrorMessage = error?.message?.replace("BugpilotError: ", "");

  let renderedChildren = (
    <Alert>
      <AlertDescription>{cleanErrorMessage}</AlertDescription>
    </Alert>
  );

  console.log("renderedChildren", renderedChildren, error, didCatch, isHandled);

  return (
    didCatch === true &&
    isHandled === true &&
    error &&
    error?.message?.includes("BugpilotError") &&
    renderedChildren
  );
}
