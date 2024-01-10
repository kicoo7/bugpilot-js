"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./ui/FallbackDialog";
import { captureError } from "../core";
import { useBugpilot } from "./Bugpilot";
import { getSessionContext } from "../context/getSessionContext";
import logger from "../logger";

export function BugpilotErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { saveBugReport } = useBugpilot();
  useEffect(() => {
    logger.info("Bugpilot debug mode enabled.");
    logger.debug("Bugpilot debug mode enabled.");
    const sessionContext = getSessionContext();
    captureError(error, { ...sessionContext, kind: "error-page" });
    saveBugReport({ triggerType: "error-page" });
  }, []);

  return <FallbackDialog reset={reset} />;
}
