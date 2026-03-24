import { Injectable } from '@nestjs/common';
import { OnboardingService } from '../../onboarding/onboarding.service';
import { OnboardingSummaryDto } from '../../onboarding/dto/onboarding-summary.dto';
import { UsersService } from '../../users/users.service';
import { AccountMetadataDto, IdentityDto, MeResponseDto, ProfileDto } from '../dto/me-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserStatus, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersService: UsersService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async getProfile(userId: string): Promise<MeResponseDto> {
    const [user, onboarding] = await Promise.all([
      this.usersService.findById(userId),
      this.onboardingService.getSummary(userId),
    ]);

    return this.toResponseDto(user, onboarding);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<void> {
    const updatePayload: {
      displayName?: string;
      avatarUrl?: string | null;
      profileMetadata?: Record<string, string>;
    } = {};

    if (dto.displayName !== undefined) {
      updatePayload.displayName = dto.displayName;
    }

    if (dto.avatarUrl !== undefined) {
      updatePayload.avatarUrl = dto.avatarUrl;
    }

    if (dto.profileMetadata !== undefined) {
      const user = await this.usersService.findById(userId);
      updatePayload.profileMetadata = {
        ...(user.profileMetadata ?? {}),
        ...dto.profileMetadata,
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      return;
    }

    await this.usersService.updateProfile(userId, updatePayload);
  }

  private toResponseDto(user: UserDocument, onboarding: OnboardingSummaryDto) {
    return new MeResponseDto({
      identity: new IdentityDto({
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
      }),
      profile: new ProfileDto({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        profileMetadata: user.profileMetadata ?? {},
      }),
      metadata: new AccountMetadataDto({
        status: user.status ?? UserStatus.ACTIVE,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin ?? null,
        defaultWorkspaceId: user.defaultWorkspaceId?.toString() ?? null,
        activeWorkspaceId: user.activeWorkspaceId?.toString() ?? null,
        onboarding,
      }),
    });
  }
}
