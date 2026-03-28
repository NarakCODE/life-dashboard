import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectSeeder } from './seeds/project-seeder';

@Module({
  imports: [
    WorkspacesModule,
    UsersModule,
    forwardRef(() => TasksModule),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService, ProjectSeeder],
  exports: [ProjectsRepository, ProjectsService, ProjectSeeder],
})
export class ProjectsModule {}
