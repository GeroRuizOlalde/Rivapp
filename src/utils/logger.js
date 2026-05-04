import { appConfig } from '../config/appConfig';
import { captureError } from './sentry';

const canDebug = () => appConfig.enableDebugLogs;

const findError = (args) => args.find((arg) => arg instanceof Error);

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
    const err = findError(args) || new Error(args.map(String).join(' '));
    captureError(err, { args });
  },
};
