import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { Workflow } from './src/workflow/entities/workflow.entity';
import { Run } from './src/workflow/entities/run.entity';
import { StepRun } from './src/workflow/entities/steprun.entity';
import { WorkflowVersion } from './src/workflow/entities/workflow-versions.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [Workflow, Run, StepRun, WorkflowVersion],
  migrations: ['src/migrations/*.ts'],
});
