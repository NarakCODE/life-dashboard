import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';

/**
 * Encapsulates all Mongoose queries for Tasks (arch-use-repository-pattern).
 */
@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<TaskDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<TaskDocument[]>
  // async create(dto: CreateTaskDto, userId: string): Promise<TaskDocument>
  // async update(id: string, dto: Partial<CreateTaskDto>): Promise<TaskDocument | null>
  // async delete(id: string): Promise<void>
}
