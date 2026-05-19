const formatScope = scope => (scope ? `[${scope}]` : '[app]');

export const logger = {
  info(scope, message, meta) {
    console.log(formatScope(scope), message, meta ?? '');
  },

  warn(scope, message, meta) {
    console.warn(formatScope(scope), message, meta ?? '');
  },

  error(scope, message, error) {
    console.error(formatScope(scope), message, error ?? '');
  },
};

