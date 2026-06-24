import { z } from 'zod';

// Validate and normalize environment configuration at startup so the app
// fails fast on misconfiguration rather than at first request.
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Path to the SQLite database file. ":memory:" is used by the test suite.
  DATABASE_PATH: z.string().default('./data/stock-system.db'),
  // Secret used to sign JWTs. A default is allowed outside production only.
  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Price simulator tick interval in milliseconds.
  TICK_MS: z.coerce.number().int().positive().default(3000),
  // How often each user's net-worth is snapshotted for history charts.
  SNAPSHOT_MS: z.coerce.number().int().positive().default(60000),
  // Starting virtual cash granted to each new account.
  STARTING_CASH: z.coerce.number().positive().default(100000),
  // Comma-separated list of allowed CORS origins, or "*".
  CORS_ORIGIN: z.string().default('*'),
  // Bcrypt cost factor.
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
  console.error('JWT_SECRET is required in production.');
  process.exit(1);
}

export const config = {
  ...env,
  // Stable fallback secret for development/test only.
  JWT_SECRET:
    env.JWT_SECRET || 'dev-insecure-secret-do-not-use-in-production',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test'
};
