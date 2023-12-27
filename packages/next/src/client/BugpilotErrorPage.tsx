"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./ui/FallbackDialog";
import { captureError } from "../core";
import { useBugpilot } from "./Bugpilot";
import { getSessionContext } from "../context/getSessionContextClient";

export function BugpilotErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { saveBugReport } = useBugpilot();
  useEffect(() => {
    const context = getSessionContext();
    captureError(error, { ...context, kind: "error-page" });
    saveBugReport({ triggerType: "error-page" });
  }, []);

  return <FallbackDialog reset={reset} />;
}
