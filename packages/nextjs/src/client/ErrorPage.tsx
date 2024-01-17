"use client";
import { useEffect } from "react";
import { captureError } from "../core";
import { useBugpilot } from "./Bugpilot";
import { FallbackDialog } from "./ui/FallbackDialog";

const isDevelopment = process.env.NODE_ENV === "development";

function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { saveBugReport } = useBugpilot();

  useEffect(() => {
    captureError(error, { kind: "error-page" });
    saveBugReport({ triggerType: "error-page" });
  }, [error]);

  return <FallbackDialog reset={reset} />;
}

export const BugpilotErrorPage = isDevelopment ? undefined : ErrorPage;
