import { Injectable } from '@nestjs/common';
import { GoalsRepository } from './goals.repository';
import { GoalDocument } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly goalsRepo: GoalsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<GoalDocument>
  // async findByUserId(userId: string): Promise<GoalDocument[]>
  // async create(dto: CreateGoalDto, userId: string): Promise<GoalDocument>
  // async update(id: string, dto: Partial<CreateGoalDto>): Promise<GoalDocument>
  // async delete(id: string): Promise<void>
}
