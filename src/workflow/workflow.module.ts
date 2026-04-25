import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Run } from './entities/run.entity';
import { StepRun } from './entities/steprun.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowGateway } from './workflow.gateway';
import { AiService } from './ai.service';
import { User } from '../auth/entities/user.entity';
import { WorkflowVersion } from './entities/workflow-versions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, Run, StepRun, User, WorkflowVersion]),
  ],
  providers: [WorkflowService, WorkflowGateway, AiService],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
