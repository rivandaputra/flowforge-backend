import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Run } from './run.entity';

@Entity()
export class StepRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @Column()
  stepId: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  log: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Run, (run) => run.steps)
  run: Run;
}
