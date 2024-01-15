import { headers, cookies } from "next/headers";
import logger from "../logger";
import { BugpilotSessionContext } from "../types";

/**
 * Helper function that gets the cookie value by name
 */
function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? "";
  }

  return "";
}

/*
 * Gets the session context for client-side errors
 */
function getSessionContextClient(): BugpilotSessionContext | {} {
  const workspaceIdReportId = getCookie("com.bugpilot.report.id");
  const [workspaceId, reportId] = workspaceIdReportId?.split(":");

  const context = {
    origin: window.location.origin,
    url: window.location.href,
    anonymousId: getCookie("com.bugpilot.user.anonymousid"),
    reportId: String(reportId),
    workspaceId: workspaceId,
  };

  return context;
}

/*
 * Gets the session context for server-side errors
 */
function getSessionContextServer(): BugpilotSessionContext | {} {
  const workspaceIdReportId = cookies()
    .get("com.bugpilot.report.id")
    ?.value.split(":");

  const context = {
    origin: headers().get("origin"),
    url: headers().get("referer") || "https://example.com/",
    anonymousId: cookies().get("com.bugpilot.user.anonymousid")?.value,
    reportId: workspaceIdReportId && workspaceIdReportId[1],
  };

  return context;
}

/**
 * Gets the session context for client-side errors
 */
export function getSessionContext(): BugpilotSessionContext | {} {
  let context = {};
  try {
    // check if browser or server
    if (typeof window === "undefined") {
      context = getSessionContextServer();
    } else {
      context = getSessionContextClient();
    }
  } catch (error) {
    logger.debug(
      "Bugpilot.getSessionContext: error while getting session context. Returning empty object",
      error
    );
  }

  return context;
}
