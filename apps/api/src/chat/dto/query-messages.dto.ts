import { IsOptional, IsMongoId, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryMessagesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  channelId?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  before?: string;

  @ApiPropertyOptional({ example: '2026-03-31T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  after?: string;
}

// Internal type that requires channelId
export interface QueryMessagesWithChannel extends QueryMessagesDto {
  channelId: string;
}
