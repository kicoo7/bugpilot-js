import { NextConfig } from "next/types";
import logger from "../logger";

const path = require("path");

export function withBugpilotConfig(
  nextConfig: NextConfig,
  bugpilotConfig: any
) {
  if (!bugpilotConfig?.workspaceId) {
    throw new Error("Bugpilot: workspaceId is required");
  }

  // overwrite any nextConfig properties from bugpilot.config.js
  const newNextConfig = { ...nextConfig, ...bugpilotConfig.next };

  return {
    ...newNextConfig,
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      const newConfig = { ...config };

      if (dev === true) {
        logger.info("Bugpilot only works in production mode.");
        return newConfig;
      }

      if (bugpilotConfig?.debug === true) {
        logger.setDebug(true);
        logger.debug("Bugpilot: debug mode enabled");
      }

      if (isServer === true) {
        newConfig.module = {
          ...newConfig.module,
          rules: [...(newConfig.module?.rules || [])],
        };

        // Wrap all page components
        newConfig.module.rules.unshift({
          test: /\/page.tsx$/,
          include: /app/,
          use: [
            {
              loader: path.resolve(__dirname, "wrappingLoader.js"),
              options: {
                buildId,
                dev,
                nextRuntime,
                kind: "page-component",
                workspaceId: bugpilotConfig?.workspaceId,
              },
            },
          ],
        });

        // Wrap all server components
        newConfig.module.rules.unshift({
          test: /\.tsx$/,
          exclude: /(page|layout|error|global-error|not_found|middleware).tsx$/,
          use: [
            {
              loader: path.resolve(__dirname, "wrappingLoader.js"),
              options: {
                buildId,
                dev,
                nextRuntime,
                kind: "server-component",
                workspaceId: bugpilotConfig?.workspaceId,
              },
            },
          ],
        });

        // Wrap all Server Actions (could also be inline)
        newConfig.module.rules.unshift({
          test: /\.(ts|tsx)$/,
          exclude: /(layout|error|global-error|not_found|middleware).tsx$/,
          include: /app/,
          use: [
            {
              loader: path.resolve(__dirname, "wrappingLoader.js"),
              options: {
                buildId,
                dev,
                nextRuntime,
                kind: "server-action",
                workspaceId: bugpilotConfig?.workspaceId,
              },
            },
          ],
        });

        // Insert Bugpilot to root layout.tsx to enable screen recording
        newConfig.module.rules.unshift({
          test: /\/layout.tsx$/,
          include: /app/,
          use: [
            {
              loader: path.resolve(__dirname, "injectLoader.js"),
              options: {
                injectKind: "bugpilot",
                workspaceId: bugpilotConfig?.workspaceId,
              },
            },
          ],
        });
        if (nextRuntime === "edge") {
          // Wrap middleware
          newConfig.module.rules.unshift({
            test: /middleware.ts$/,
            use: [
              {
                loader: path.resolve(__dirname, "wrappingLoader.js"),
                options: {
                  buildId,
                  dev,
                  nextRuntime,
                  kind: "middleware",
                  workspaceId: bugpilotConfig?.workspaceId,
                },
              },
            ],
          });
        }
      }

      return newConfig;
    },
  };
}
