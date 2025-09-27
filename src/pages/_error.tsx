import * as Sentry from '@sentry/react';
import NextErrorComponent, { ErrorProps } from 'next/error';

export default function CustomError(props: ErrorProps) {
  return <NextErrorComponent {...props} />;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
CustomError.getInitialProps = async (contextData: any) => {
  if (contextData.err) {
    Sentry.captureException(contextData.err);
  }
  return NextErrorComponent.getInitialProps(contextData);
};
