import fs from "node:fs";
import path from "node:path";
import { NextConfig } from "next/types";
import logger from "../logger";
import { createWebpackConfigFunction } from "./webpack";
import { BugpilotConfig } from "../types";

export function withBugpilotConfig(
  userNextConfig: NextConfig,
  userBugpilotConfig?: BugpilotConfig
) {
  let bugpilotConfig;

  const bugpilotConfigPath = path.resolve(process.cwd(), "bugpilot.config.js");
  if (fs.existsSync(bugpilotConfigPath)) {
    bugpilotConfig = require(bugpilotConfigPath);
  } else {
    bugpilotConfig = userBugpilotConfig;
  }

  if (bugpilotConfig?.workspaceId === undefined) {
    throw new Error("Missing property 'workspaceId' in bugpilot.config.js.");
  }

  if (process.env.NODE_ENV !== "production") {
    logger.info("Bugpilot only captures errors in production.");
    return userNextConfig;
  }

  if (bugpilotConfig?.debug === true) {
    logger.setDebug(true);
    logger.debug("Bugpilot debug mode enabled.");
  }

  const webpackConfigFunction = createWebpackConfigFunction(bugpilotConfig);

  return {
    ...userNextConfig,
    // we can override next.config.js properties related to source maps here
    ...bugpilotConfig?.next,
    webpack: webpackConfigFunction,
  };
}
