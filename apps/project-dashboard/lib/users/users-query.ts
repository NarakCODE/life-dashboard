import {
  useQuery,
  type UseQueryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-client";
import { getUserById } from "@/lib/users/users-client";
import type { UserProfile } from "@/lib/users/user-types";

const defaultStaleTime = 5 * 60 * 1000;
const defaultGcTime = 10 * 60 * 1000;

export const userKeys = {
  all: ["users"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (userId: string) => [...userKeys.details(), userId] as const,
} as const;

export const userQueries = {
  detail: (userId: string) => ({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: Boolean(userId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),
};

export function useUserDetailsQuery(
  userId: string,
  options?: Omit<
    UseQueryOptions<UserProfile, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...userQueries.detail(userId),
    ...options,
  });
}

export function prefetchUserDetails(queryClient: QueryClient, userId: string) {
  return queryClient.prefetchQuery(userQueries.detail(userId));
}
