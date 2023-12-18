const path = require("path");
module.exports = function withBugpilotConfig(nextConfig) {
  return {
    ...nextConfig,
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      const newConfig = { ...config };

      if (
        isServer === true
        // && nextRuntime === "nodejs"
      ) {
        newConfig.module = {
          ...newConfig.module,
          rules: [...(newConfig.module?.rules || [])],
        };

        newConfig.module.rules.unshift({
          test: /\.tsx$/,
          // todo: exclude head, not_found, global-error, etc.
          exclude: /(layout|error).tsx$/,
          use: [
            {
              loader: path.resolve(__dirname, "serverComponentsLoader.js"),
            },
          ],
        });

        newConfig.module.rules.unshift({
          test: /\.ts$/,
          // todo: exclude head, not_found, global-error, etc.
          exclude: /(layout|error).tsx$/,
          use: [
            {
              loader: path.resolve(__dirname, "serverActionLoader.js"),
            },
          ],
        });
      }

      // to do: route, middleware.

      return newConfig;
    },
  };
};
