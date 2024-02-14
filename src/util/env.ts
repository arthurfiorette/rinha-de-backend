import { error } from './log.js';

export const Env = {
  PORT: Number(process.env['PORT']) || 3000,
  POSTGRES_URL: process.env['POSTGRES_URL']?.trim() || '',
  APP_ENV: (process.env['APP_ENV']?.toLowerCase().trim() as 'dev' | 'prod') || 'dev'
};

if (isNaN(Env.PORT)) {
  error('Invalid Env.PORT:', process.env['PORT']);
  process.exit(1);
}

if (!Env.POSTGRES_URL) {
  error('Invalid Env.POSTGRES_URL:', process.env['POSTGRES_URL']);
  process.exit(1);
}

if (!['dev', 'prod'].includes(Env.APP_ENV)) {
  error('Invalid Env.APP_ENV:', Env.APP_ENV);
  process.exit(1);
}
