#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// check if workspaceId is passed as an argument
if (process.argv.length < 3 && process.argv[2] !== "--workspaceId") {
  console.log("--workspaceId is missing. Exiting...");
  process.exit(1);
}

const rootDir = process.cwd();
const nextConfigPath = path.join(rootDir, "next.config.js");
const appDir = path.join(rootDir, "app");

// check if next.config.js exists
if (!fs.existsSync(nextConfigPath)) {
  console.log("next.config.js not found. Exiting...");
  process.exit(1);
}

// check if app/ exists
if (!fs.existsSync(appDir)) {
  console.log("Bugpilot only works with app router. Exiting...");
  process.exit(1);
}

// create bugpilot.config.js if it doesn't exist
const bugpilotConfigPath = path.join(rootDir, "bugpilot.config.js");
if (!fs.existsSync(bugpilotConfigPath)) {
  const bugpilotConfig = `
  const bugpilotConfig = {
    "workspaceId": process.argv[3],
  }
  module.exports = bugpilotConfig;
  `;

  fs.writeFileSync(bugpilotConfigPath, bugpilotConfig);
} else {
  console.log("bugpilot.config.js exists. Skipping...");
}

// wrap next.config.js with withBugpilotConfig
let nextJSConfigContent = fs.readFileSync(nextConfigPath, "utf8");
if (!nextJSConfigContent.includes("module.exports = withBugpilotConfig(")) {
  // Append the wrapper function at the beginning of the file
  nextJSConfigContent =
    `const withBugpilotConfig = require("@kicoo7/next-v2"); ` +
    nextJSConfigContent;

  // Replace the original module.exports assignment with the wrapped version
  nextJSConfigContent = nextJSConfigContent.replace(
    /^(module\.exports\s*=\s*)(.*);/m,
    (_, prefix, originalExport) =>
      `module.exports = withBugpilotConfig(${originalExport});`
  );

  // Write the updated content back to the file
  fs.writeFileSync(nextConfigPath, nextJSConfigContent, "utf8");
}

// install @kicoo7/next-v2 && npm run build
const { exec } = require("child_process");

exec(
  "npm install @kicoo7/next-v2 && npm run build",
  (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      process.exit(1);
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      process.exit(1);
    }
    console.log(`stdout: ${stdout}`);
  }
);
