import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BudgetPeriod } from '../schemas/budget.schema';

export class QueryBudgetDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BudgetPeriod })
  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isActive?: boolean;
}
