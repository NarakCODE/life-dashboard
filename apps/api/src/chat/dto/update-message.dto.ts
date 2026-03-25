import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiProperty({ example: 'Updated message content', maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  content!: string;
}
