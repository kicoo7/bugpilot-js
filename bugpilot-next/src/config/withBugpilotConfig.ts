const path = require("path");

export function withBugpilotConfig(nextConfig: any) {
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

        newConfig.module.rules.unshift({
          test: /\.(ts|tsx)$/,
          // todo: exclude head, not_found, global-error, etc.
          exclude: /(layout|error|global-error|not_found|middleware).tsx$/,
          include: /app/,

          use: [
            {
              loader: path.resolve(__dirname, "loader.js"),
              options: {
                buildId,
                dev,
                nextRuntime,
              },
            },
          ],
        });
      }

      return newConfig;
    },
  };
}
