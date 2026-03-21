import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepo: TasksRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<TaskDocument>
  // async findByUserId(userId: string): Promise<TaskDocument[]>
  // async create(dto: CreateTaskDto, userId: string): Promise<TaskDocument>
  // async update(id: string, dto: Partial<CreateTaskDto>): Promise<TaskDocument>
  // async delete(id: string): Promise<void>
}
