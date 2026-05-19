const formatScope = (scope?: string) => (scope ? `[${scope}]` : '[app]');

export const logger = {
  info(scope: string, message: string, meta?: unknown) {
    console.log(formatScope(scope), message, meta ?? '');
  },

  warn(scope: string, message: string, meta?: unknown) {
    console.warn(formatScope(scope), message, meta ?? '');
  },

  error(scope: string, message: string, error?: unknown) {
    console.error(formatScope(scope), message, error ?? '');
  },
};
