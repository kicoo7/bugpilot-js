"use client";
import { useEffect } from "react";
import { captureError } from "../core";
import { useBugpilot } from "./Bugpilot";
import { FallbackDialog } from "./ui/FallbackDialog";

const isDevelopment = process.env.NODE_ENV === "development";

function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { saveBugReport } = useBugpilot();

  useEffect(() => {
    captureError(error, { kind: "global-error-page" });
    saveBugReport({ triggerType: "global-error-page" });
  }, []);

  return (
    <html>
      <body>
        <FallbackDialog reset={reset} />
      </body>
    </html>
  );
}

export const BugpilotGlobalErrorPage = isDevelopment
  ? undefined
  : GlobalErrorPage;
