import axios from 'axios';

interface ApiErrorPayload {
  message?: string;
  error?: string;
  errors?: unknown;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function toHttpError(error: unknown): HttpError {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const message =
      payload?.message ??
      payload?.error ??
      error.message ??
      'An unexpected network error occurred.';

    return new HttpError(message, error.response?.status, payload?.errors);
  }

  if (error instanceof Error) {
    return new HttpError(error.message);
  }

  return new HttpError('An unexpected error occurred.');
}
