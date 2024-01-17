import path from "node:path";
import { BugpilotConfig } from "../types";

export function createWebpackConfigFunction(bugpilotConfig: BugpilotConfig) {
  return function (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) {
    const newConfig = {
      ...config,
      module: {
        rules: [...(config.module?.rules || [])],
      },
    };
    const options = {
      buildId,
      dev,
      nextRuntime,
      workspaceId: bugpilotConfig?.workspaceId,
      debug: bugpilotConfig?.debug,
    };

    if (nextRuntime === "edge") {
      // Wrap middleware
      newConfig.module.rules.unshift({
        test: /middleware.ts$/,
        use: [
          {
            loader: path.resolve(__dirname, "wrappingLoader.js"),
            options: {
              ...options,
              kind: "middleware",
            },
          },
        ],
      });

      return newConfig;
    }

    if (isServer === true && nextRuntime === "node") {
      // Wrap all server components
      newConfig.module.rules.unshift({
        test: /\.tsx$/,
        exclude: /\/(page|layout|error|global-error|not_found|middleware).tsx$/,
        use: [
          {
            loader: path.resolve(__dirname, "wrappingLoader.js"),
            options: {
              ...options,
              kind: "server-component",
            },
          },
        ],
      });

      // Wrap all page components
      newConfig.module.rules.unshift({
        test: /\/page.tsx$/,
        include: /app/,
        use: [
          {
            loader: path.resolve(__dirname, "wrappingLoader.js"),
            options: {
              ...options,
              kind: "page-component",
            },
          },
        ],
      });

      // Wrap all Server Actions (could also be inline)
      newConfig.module.rules.unshift({
        test: /\.(ts|tsx)$/,
        exclude: /\/(layout|error|global-error|not_found|middleware).tsx$/,
        include: /app/,
        use: [
          {
            loader: path.resolve(__dirname, "wrappingLoader.js"),
            options: {
              ...options,
              kind: "server-action",
            },
          },
        ],
      });

      return newConfig;
    }

    // Insert Bugpilot to root layout.tsx to enable screen recording
    newConfig.module.rules.unshift({
      test: /\/layout.tsx$/,
      include: /app/,
      use: [
        {
          loader: path.resolve(__dirname, "injectLoader.js"),
          options: {
            ...options,
            injectKind: "bugpilot",
          },
        },
      ],
    });

    return newConfig;
  };
}
