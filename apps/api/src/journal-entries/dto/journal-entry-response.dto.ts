import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MoodLevel } from '../schemas/journal-entry.schema';

@Exclude()
export class JournalEntryResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  title?: string;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty({ enum: MoodLevel })
  mood?: MoodLevel;

  @Expose()
  @ApiProperty({ type: [String] })
  tags: string[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<JournalEntryResponseDto>) {
    Object.assign(this, partial);
  }
}
