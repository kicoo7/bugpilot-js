"use client";
import { useEffect } from "react";
import { FallbackDialog } from "./components/FallbackDialog.mjs";
import { captureError } from "./utils.mjs";

export function BugpilotErrorPage({ error, reset }) {
  let context = null;
  useEffect(() => {
    try {
      context = {
        origin: window?.location?.origin,
        url: window?.location?.href,
        // TODO: generate reportId?
        reportId: "reportId-k" + Date.now(), //window?.localStorage?.getItem("Bugpilot::reportId"),
        anonymousId: window?.localStorage?.getItem("Bugpilot::anonymousId"),
        // TODO: get workspaceId
        workspaceId: "71e2aba3-108e-43dd-8459-6b462dc01253",
      };

      console.log("BugpilotErrorPage, context: ", context);
    } catch (e) {
      console.log("BugpilotErrorPage, error in context: ", e);
      return;
    }

    return captureError({ error, context, kind: "error-page" });
  }, []);

  return <FallbackDialog error={error} reset={reset} />;
}
