import 'server-only';

import { z } from 'zod';

const serverEnvSchema = z.object({
  API_INTERNAL_BASE_URL: z.string().url().optional(),
});

const serverEnvResult = serverEnvSchema.safeParse({
  API_INTERNAL_BASE_URL: process.env.API_INTERNAL_BASE_URL,
});

if (!serverEnvResult.success) {
  throw new Error(
    `Invalid server environment variables: ${serverEnvResult.error.message}`,
  );
}

export const serverEnv = serverEnvResult.data;
