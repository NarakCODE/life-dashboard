import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksRepository } from './tasks.repository';
import { TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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
    const task = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const oldStatus = task.status;
    const updatedTask = await this.tasksRepo.updateByIdAndUser(id, userId, dto);

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    // Emit status change event if status changed
    if (dto.status && dto.status !== oldStatus) {
      this.eventEmitter.emit('task.status_changed', {
        taskId: id,
        userId,
        oldStatus,
        newStatus: dto.status,
      });
    }

    return updatedTask;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const deleted = await this.tasksRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }

    // Emit deletion event for goals module to handle cleanup
    this.eventEmitter.emit('task.deleted', {
      taskId: id,
      userId,
    });

    this.logger.log(`Task ${id} deleted by user ${userId}`);
  }

  async getTaskOverview(userId: string) {
    return this.tasksRepo.getTaskOverview(userId);
  }
}
