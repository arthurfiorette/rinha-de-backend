export const log = console.log.bind(
  console,
  // yellow      gray
  '\x1b[33m[LOG]\x1b[90m'
);

export const error = console.error.bind(
  console,
  // red        gray
  '\x1b[31m[ERROR]\x1b[90m'
);

export const debug = console.debug.bind(
  console,
  // cyan       gray
  '\x1b[36m[DEBUG]\x1b[90m'
);
