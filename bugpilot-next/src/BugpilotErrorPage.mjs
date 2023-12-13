"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./components/FallbackDialog.mjs";
import { captureError, getClientContext } from "./utils.mjs";

export function BugpilotErrorPage({ error, reset }) {
  useEffect(() => {
    const context = getClientContext();
    captureError({ error, context, kind: "error-page" });
  }, []);

  return <FallbackDialog error={error} reset={reset} />;
}
