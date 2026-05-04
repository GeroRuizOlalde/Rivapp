import { appConfig } from '../config/appConfig';

let SentryRef = null;
let initPromise = null;

export const initSentry = () => {
  if (initPromise) return initPromise;
  if (!appConfig.sentryDsn) return Promise.resolve(null);

  initPromise = import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: appConfig.sentryDsn,
      environment: appConfig.sentryEnvironment,
      release: appConfig.sentryRelease || undefined,
      tracesSampleRate: appConfig.isProd ? 0.1 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: appConfig.isProd ? 1.0 : 0,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    });
    SentryRef = Sentry;
    return Sentry;
  });

  return initPromise;
};

export const isSentryEnabled = () => SentryRef !== null;

export const captureError = (error, context) => {
  if (!SentryRef) return;
  if (context) {
    SentryRef.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
      SentryRef.captureException(error);
    });
  } else {
    SentryRef.captureException(error);
  }
};

export const setUserContext = (user) => {
  if (!SentryRef) return;
  SentryRef.setUser(user ? { id: user.id, email: user.email } : null);
};
