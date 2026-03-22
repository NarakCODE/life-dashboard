import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async create(
    dto: CreateUserDto & { passwordHash: string },
  ): Promise<UserDocument> {
    return this.usersRepo.create(dto);
  }

  async markEmailVerified(id: string | Types.ObjectId): Promise<void> {
    return this.usersRepo.markEmailVerified(id);
  }

  async updateWorkspacePreferences(
    id: string | Types.ObjectId,
    update: {
      defaultWorkspaceId?: string | Types.ObjectId | null;
      activeWorkspaceId?: string | Types.ObjectId | null;
    },
  ): Promise<void> {
    return this.usersRepo.updateWorkspacePreferences(id, update);
  }
}
