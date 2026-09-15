import type { Job, JobStatus } from './types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? 'https://mini-job-queue-dashboard.onrender.com'
    : 'http://localhost:3000');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getJobs() {
  return request<Job[]>('/jobs');
}

export function createJob(input: { title: string; type: string }) {
  return request<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateJobStatus(job: Job, status: JobStatus) {
  return request<Job>(`/jobs/${job.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, version: job.version })
  });
}

export function deleteJob(id: string) {
  return request<{ deleted: boolean }>(`/jobs/${id}`, {
    method: 'DELETE'
  });
}
