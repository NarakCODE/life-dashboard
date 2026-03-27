export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isEmailVerified: boolean;
  status: string;
  avatarUrl?: string | null;
  profileMetadata?: Record<string, string>;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}
