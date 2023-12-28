import { NextConfig } from "next/types";

const path = require("path");

export function withBugpilotConfig(
  nextConfig: NextConfig,
  bugpilotConfig: any
) {
  if (!bugpilotConfig?.workspaceId) {
    throw new Error("Bugpilot: workspaceId is required");
  }

  return {
    ...nextConfig,
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      const newConfig = { ...config };

      if (isServer === true && nextRuntime === "nodejs") {
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
      }

      return newConfig;
    },
  };
}
