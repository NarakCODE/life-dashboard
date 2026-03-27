import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating or retrieving a DM channel with another user.
 * The system will return existing DM channel if one already exists,
 * or create a new one if it doesn't.
 */
export class CreateOrGetDmDto {
  @ApiProperty({ description: 'The user ID to create/get DM with' })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;
}
