/// <reference path="../.astro/types.d.ts" />

interface Window {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  bloxtierAnalytics?: {
    event: (name: string, params: Record<string, string>, callback?: () => void) => void;
  };
}
