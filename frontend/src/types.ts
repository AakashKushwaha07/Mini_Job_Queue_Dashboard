export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type Job = {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  version: number;
};
