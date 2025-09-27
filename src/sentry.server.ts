import * as Sentry from '@sentry/node';

if (process.env.NEXT_PUBLIC_SENTRY_DSN && !Sentry.getCurrentHub().getClient()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV,
  });
}
