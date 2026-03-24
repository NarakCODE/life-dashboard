import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod } from '../schemas/budget.schema';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Monthly Groceries' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'food' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-03-31T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;
}
