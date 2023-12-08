"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./components/FallbackDialog.mjs";
import { useBugpilot } from "./Bugpilot.mjs";

export function BugpilotErrorPage({ error, reset }) {
  const { saveBugReport } = useBugpilot();
  useEffect(() => {
    // Simo: Do we want to add error information to bugpilot report?
    saveBugReport();
  }, [saveBugReport]);

  return <FallbackDialog error={error} reset={reset} />;
}
