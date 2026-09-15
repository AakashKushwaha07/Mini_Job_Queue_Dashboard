import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  VersionColumn
} from 'typeorm';
import { JobStatus } from './job-status.enum';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  type!: string;

  @Column({
    type: 'text',
    default: JobStatus.Pending
  })
  status!: JobStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @VersionColumn()
  version!: number;
}
