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
}
