import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OtpCode, OtpCodeDocument, OtpType } from './schemas/otp-code.schema';
import { CreateOtpCodeDto } from './dto/create-otp-code.dto';

/**
 * Encapsulates all Mongoose queries for OtpCodes (arch-use-repository-pattern).
 */
@Injectable()
export class OtpCodesRepository {
  constructor(
    @InjectModel(OtpCode.name) private readonly otpCodeModel: Model<OtpCodeDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<OtpCodeDocument | null>
  // async findValidCode(userId: string, code: string, type: OtpType): Promise<OtpCodeDocument | null>
  // async create(dto: CreateOtpCodeDto, userId: string): Promise<OtpCodeDocument>
  // async markAsUsed(id: string): Promise<void>
  // async delete(id: string): Promise<void>
}
