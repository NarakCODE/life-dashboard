import {
  isServer,
  QueryClient,
  type DefaultOptions,
} from '@tanstack/react-query';
import { isHttpError } from '@/lib/http/http-error';

const queryDefaults: DefaultOptions = {
  queries: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (isHttpError(error) && error.statusCode) {
        if ([400, 401, 403, 404].includes(error.statusCode)) {
          return false;
        }
      }

      return failureCount < 2;
    },
  },
  mutations: {
    retry: 0,
  },
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryDefaults,
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}
