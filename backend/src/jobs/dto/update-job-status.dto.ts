import { IsEnum, IsInt, Min } from 'class-validator';
import { JobStatus } from '../job-status.enum';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsInt()
  @Min(1)
  version!: number;
}
