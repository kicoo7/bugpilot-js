const path = require("path");
module.exports = function withBugpilotConfig(nextConfig) {
  return {
    ...nextConfig,
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      console.log("config", isServer, nextRuntime);
      const newConfig = { ...config };

      if (isServer === true && nextRuntime === "nodejs") {
        newConfig.module = {
          ...newConfig.module,
          rules: [...(newConfig.module?.rules || [])],
        };

        newConfig.module.rules.push({
          test: /page\.tsx$/,
          use: [
            {
              loader: path.resolve(__dirname, "wrapExportLoader.js"),
            },
            defaultLoaders.babel,
          ],
        });
      }

      // console.log("config after:", config.module.rules);

      return newConfig;
    },
  };
};
