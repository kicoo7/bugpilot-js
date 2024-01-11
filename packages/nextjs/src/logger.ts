const BANNER = (level = "debug") => [
  `%c[@bugpilot/next]%c [${new Date().toISOString()}] %c[${level.toUpperCase()}]`,
  "color:white; font-weight: bold; border-radius: 5px; padding:2px 5px; background:purple;",
  "color:#999;",
  "color:#6060ff;",
];

const logger = {
  debugMode: false,
  info(...args: any[]) {
    console.log(...BANNER("info"), ...args);
  },
  warn(...args: any[]) {
    console.warn(...BANNER("warn"), ...args);
  },
  error(...args: any[]) {
    console.error(...BANNER("error"), ...args);
  },
  debug(...args: any[]) {
    if (this.debugMode === true) {
      console.debug(...BANNER("debug"), ...args);
    }
  },
  setDebug(value: boolean) {
    this.debugMode = value;
  },
};

export default logger;
