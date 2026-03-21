import { Injectable } from '@nestjs/common';
import { OtpCodesRepository } from './otp-codes.repository';
import { OtpCodeDocument, OtpType } from './schemas/otp-code.schema';
import { CreateOtpCodeDto } from './dto/create-otp-code.dto';

@Injectable()
export class OtpCodesService {
  constructor(private readonly otpCodesRepo: OtpCodesRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<OtpCodeDocument>
  // async findValidCode(userId: string, code: string, type: OtpType): Promise<OtpCodeDocument>
  // async create(dto: CreateOtpCodeDto, userId: string): Promise<OtpCodeDocument>
  // async markAsUsed(id: string): Promise<void>
  // async delete(id: string): Promise<void>
}
