import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_versions')
export class WorkflowVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflow_id: string;

  @Column()
  version_number: string;

  @Column({ type: 'json' })
  definition: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  modifiedAt: Date;

  @ManyToOne(() => Workflow, (workflow) => workflow.versions)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;
}
