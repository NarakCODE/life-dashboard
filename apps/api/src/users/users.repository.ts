import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Encapsulates all Mongoose queries for Users (arch-use-repository-pattern).
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(
    dto: CreateUserDto & { passwordHash: string },
  ): Promise<UserDocument> {
    const user = new this.userModel({
      email: dto.email.toLowerCase(),
      passwordHash: dto.passwordHash,
      displayName: dto.displayName,
    });
    return user.save();
  }

  async updateRefreshTokenHash(
    id: string | Types.ObjectId,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash }).exec();
  }

  async clearRefreshToken(id: string | Types.ObjectId): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { refreshTokenHash: null })
      .exec();
  }
}
