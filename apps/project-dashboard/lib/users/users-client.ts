import { apiRequest } from "@/lib/api/api-client";
import type { UserProfile } from "@/lib/users/user-types";

export function getUserById(userId: string) {
  return apiRequest<UserProfile>({
    path: `/users/${userId}`,
    auth: "required",
  });
}
