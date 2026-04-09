import { appConfig } from '../config/appConfig';

const canDebug = () => appConfig.enableDebugLogs;

export const logger = {
  debug: (...args) => {
    if (canDebug()) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (canDebug()) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  },
};
