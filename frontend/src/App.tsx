import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Play, Plus, RefreshCw, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import { createJob, deleteJob, getJobs, updateJobStatus } from './api';
import type { Job, JobStatus } from './types';

const statuses: JobStatus[] = ['pending', 'running', 'completed', 'failed'];
const statusLabels: Record<JobStatus | 'all', string> = {
  all: 'All',
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed'
};

const nextStatuses: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: []
};

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      setJobs(await getJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  const counts = useMemo(() => {
    return statuses.reduce(
      (acc, status) => ({
        ...acc,
        [status]: jobs.filter((job) => job.status === status).length
      }),
      { all: jobs.length, pending: 0, running: 0, completed: 0, failed: 0 }
    );
  }, [jobs]);

  const visibleJobs = filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const job = await createJob({ title, type });
      setJobs((current) => [job, ...current]);
      setTitle('');
      setType('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create job');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(job: Job, status: JobStatus) {
    setBusyJobId(job.id);
    setError(null);

    try {
      const updated = await updateJobStatus(job, status);
      setJobs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update job');
      await loadJobs();
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyJobId(id);
    setError(null);

    try {
      await deleteJob(id);
      setJobs((current) => current.filter((job) => job.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete job');
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Queue Control</p>
          <h1>Mini Job Queue</h1>
        </div>
        <button className="icon-button" onClick={loadJobs} aria-label="Refresh jobs" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </section>

      <form className="create-form" onSubmit={handleCreate}>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Send invoice"
            maxLength={120}
            required
          />
        </label>
        <label>
          Type
          <input
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="email"
            maxLength={60}
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          <Plus size={18} />
          {saving ? 'Creating' : 'Create'}
        </button>
      </form>

      <section className="status-tabs" aria-label="Filter jobs by status">
        {(['all', ...statuses] as const).map((status) => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
            type="button"
          >
            <span>{statusLabels[status]}</span>
            <strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      {error && (
        <div className="error-banner">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="job-list">
        {loading ? (
          <div className="empty-state">Loading jobs...</div>
        ) : visibleJobs.length === 0 ? (
          <div className="empty-state">No jobs found.</div>
        ) : (
          visibleJobs.map((job) => (
            <article className="job-row" key={job.id}>
              <div className="job-main">
                <span className={`status-pill ${job.status}`}>{statusLabels[job.status]}</span>
                <h2>{job.title}</h2>
                <p>
                  {job.type} • {new Date(job.createdAt).toLocaleString()} • v{job.version}
                </p>
              </div>
              <div className="job-actions">
                {nextStatuses[job.status].map((status) => (
                  <button
                    key={status}
                    className="secondary-button"
                    onClick={() => void handleStatusChange(job, status)}
                    disabled={busyJobId === job.id}
                    type="button"
                  >
                    {status === 'running' ? <Play size={16} /> : <CheckCircle2 size={16} />}
                    {statusLabels[status]}
                  </button>
                ))}
                <button
                  className="icon-button danger"
                  onClick={() => void handleDelete(job.id)}
                  disabled={busyJobId === job.id}
                  aria-label={`Delete ${job.title}`}
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
