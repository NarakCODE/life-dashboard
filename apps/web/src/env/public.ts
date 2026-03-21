import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production', 'test']),
  NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

const publicEnvResult = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS,
});

if (!publicEnvResult.success) {
  throw new Error(
    `Invalid public environment variables: ${publicEnvResult.error.message}`,
  );
}

export const publicEnv = publicEnvResult.data;
