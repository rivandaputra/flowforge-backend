import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Run } from './run.entity';
import { WorkflowVersion } from './workflow-versions.entity';

@Entity()
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  current_version: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  modifiedAt: Date;

  @OneToMany(() => Run, (run) => run.workflow)
  runs: Run[];

  @OneToMany(() => WorkflowVersion, (version) => version.workflow)
  versions: WorkflowVersion[];
}
