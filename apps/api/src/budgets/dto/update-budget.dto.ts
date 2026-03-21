import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
