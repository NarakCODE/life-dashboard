import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepo: TasksRepository) {}

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDocument> {
    return this.tasksRepo.create(userId, dto);
  }

  async findByIdAndUser(id: string, userId: string): Promise<TaskDocument> {
    const task = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findMany(userId: string, query: QueryTaskDto) {
    return this.tasksRepo.findWithPaginationAndFilters(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDocument> {
    const task = await this.tasksRepo.updateByIdAndUser(id, userId, dto);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.tasksRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }
  }

  async getTaskOverview(userId: string) {
    return this.tasksRepo.getTaskOverview(userId);
  }
}
