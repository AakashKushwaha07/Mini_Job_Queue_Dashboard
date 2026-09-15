import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { Job } from './job.entity';
import { JobStatus } from './job-status.enum';

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  [JobStatus.Pending]: [JobStatus.Running],
  [JobStatus.Running]: [JobStatus.Completed, JobStatus.Failed],
  [JobStatus.Completed]: [],
  [JobStatus.Failed]: []
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>
  ) {}

  async create(dto: CreateJobDto) {
    const title = dto.title.trim();
    const type = dto.type.trim();

    if (!title || !type) {
      throw new BadRequestException('Title and type are required');
    }

    const job = this.jobsRepository.create({
      title,
      type,
      status: JobStatus.Pending
    });

    return this.jobsRepository.save(job);
  }

  findAll() {
    return this.jobsRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto) {
    return this.jobsRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Job);
      const job = await repository.findOne({ where: { id } });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.version !== dto.version) {
        throw new ConflictException('Job was updated by another request. Refresh and try again.');
      }

      if (job.status === dto.status) {
        return job;
      }

      if (!allowedTransitions[job.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change job status from ${job.status} to ${dto.status}`
        );
      }

      const result = await repository
        .createQueryBuilder()
        .update(Job)
        .set({
          status: dto.status,
          version: () => 'version + 1'
        })
        .where('id = :id', { id })
        .andWhere('version = :version', { version: dto.version })
        .execute();

      if (result.affected === 0) {
        throw new ConflictException('Job was updated by another request. Refresh and try again.');
      }

      const updated = await repository.findOne({ where: { id } });
      if (!updated) {
        throw new NotFoundException('Job not found');
      }

      return updated;
    });
  }

  async remove(id: string) {
    const result = await this.jobsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Job not found');
    }

    return { deleted: true };
  }
}
