import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { StepRun } from './steprun.entity';

@Entity()
export class Run {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column()
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @ManyToOne(() => Workflow, (workflow) => workflow.runs)
  workflow: Workflow;

  @OneToMany(() => StepRun, (step) => step.run)
  steps: StepRun[];
}
