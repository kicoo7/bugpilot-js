"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./components/FallbackDialog.mjs";
import { captureError, getClientContext } from "./core.mjs";
import { useBugpilot } from "./Bugpilot.mjs";

export function BugpilotErrorPage({ error, reset }) {
  const { saveBugReport } = useBugpilot();
  useEffect(() => {
    const context = getClientContext();
    captureError(error, { context, kind: "error-page" });
    saveBugReport({ triggerType: "error-page" });
  }, []);

  return <FallbackDialog error={error} reset={reset} />;
}
