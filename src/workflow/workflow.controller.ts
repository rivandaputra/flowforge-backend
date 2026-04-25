import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { RolesGuard } from '../auth/roles/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RunWorkflowDto } from './dtos/run-workflow.dto';
import { CreateWorkflowDto } from './dtos/create-workflow.dto';
import { RollbackWorkflowDto } from './dtos/rollback-workflow.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('run')
  @Roles('ADMIN', 'EDITOR')
  async run(@Body() workflow: RunWorkflowDto) {
    return this.workflowService.runWorkflow(workflow);
  }

  @Post()
  @Roles('ADMIN', 'EDITOR')
  async create(@Body() body: CreateWorkflowDto) {
    return this.workflowService.createWorkflow(body);
  }

  @Get('run/:id')
  @Roles('ADMIN', 'EDITOR')
  runById(@Param('id') id: string) {
    return this.workflowService.runWorkflowById(id);
  }

  @Post('rollback')
  @Roles('ADMIN')
  async rollbackWorkflowVersionById(@Body() body: RollbackWorkflowDto) {
    return this.workflowService.rollbackWorkflowVersionById(body);
  }
}
