#!/usr/bin/env node

// check if /app folder exists
// check if next.config.js exists
// write code below

const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const nextConfigPath = path.join(rootDir, "next.config.js");
const appDir = path.join(rootDir, "app");

if (!fs.existsSync(nextConfigPath)) {
  console.log("next.config.js not found. Exiting...");
  process.exit(1);
}

if (!fs.existsSync(appDir)) {
  console.log("Bugpilot only works with app router. Exiting...");
  process.exit(1);
}

// read the content of next.config.js, import {useBugpilotConfig} from "@kicoo7/next-v2" and wrap the config with useBugpilotConfig

const nextConfig = fs.readFileSync(nextConfigPath, "utf-8");

const bugpilotConfig = `
import { useBugpilotConfig } from "@kicoo7/next-v2";
`;

const newNextConfig = bugpilotConfig + nextConfig;

fs.writeFileSync(nextConfigPath, newNextConfig);

const errorPage = path.join(rootDir, "app/error.tsx");

if (!fs.existsSync(appDir)) {
  console.log("Error page doesn't exist. Creating...");
  const errorPageContent = `"use client";
  import { BugpilotErrorPage } from "@kicoo7/next-v2";
  export default BugpilotErrorPage;
`;
  fs.writeFileSync(errorPage, errorPageContent);
  process.exit(1);
} else {
  console.log("Error page exists. Skipping...");
}

// create a new file app/error.tsx and write the following code
// import { ErrorPage } from "@kicoo7/next-v2";
//
// export default ErrorPage;
// write the code below:

// i want to execute the following command
// npm install @kicoo7/next-v2
// npm build
// write the code below:

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
