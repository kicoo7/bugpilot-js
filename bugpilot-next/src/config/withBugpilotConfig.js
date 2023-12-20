const path = require("path");
module.exports = function withBugpilotConfig(nextConfig) {
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
          exclude: /(layout|error|global-error|not_found).tsx$/,
          include: /app/,

          use: [
            {
              loader: path.resolve(__dirname, "loader.js"),
            },
            // {
            //   loader: path.resolve(__dirname, "serverComponentsLoader.js"),
            // },
            // {
            //   loader: path.resolve(__dirname, "serverActionLoader.js"),
            // },
          ],
        });
      }

      return newConfig;
    },
  };
};
