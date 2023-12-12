"use client";
import { Button } from "./components/Button.mjs";

export function BugpilotReportBugComponent({ style, className, children }) {
  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => {}}
      style={style}
      className={[className, "bug-report-button"].join(" ")}
    >
      {children}
    </Button>
  );
}
