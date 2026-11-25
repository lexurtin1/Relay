import { randomBytes } from "node:crypto";

interface JobCredential {
  token: string;
  git: Map<string, string>;
}

export interface CredentialBroker {
  issueJobToken(jobId: string): string;
  checkJobToken(token: string): { jobId: string } | null;
  revokeJob(jobId: string): void;
  hasJob(jobId: string): boolean;
  /** Short-lived clone token. Null once the job is revoked or was never issued. */
  issueGitToken(jobId: string, repo: string): string | null;
  gitToken(jobId: string, repo: string): string | null;
}

/**
 * Job and git tokens live on the worker. The container receives a job token,
 * never the gateway key, and a git helper asks here for a repo-scoped token.
 */
export function createCredentialBroker(): CredentialBroker {
  const jobs = new Map<string, JobCredential>();

  return {
    issueJobToken(jobId) {
      const token = `job_${jobId}_${randomBytes(16).toString("hex")}`;
      jobs.set(jobId, { token, git: new Map() });
      return token;
    },
    checkJobToken(token) {
      for (const [jobId, row] of jobs) {
        if (row.token === token) return { jobId };
      }
      return null;
    },
    revokeJob(jobId) {
      jobs.delete(jobId);
    },
    hasJob(jobId) {
      return jobs.has(jobId);
    },
    issueGitToken(jobId, repo) {
      const row = jobs.get(jobId);
      if (!row) return null;
      const token = `git_${randomBytes(12).toString("hex")}`;
      row.git.set(repo, token);
      return token;
    },
    gitToken(jobId, repo) {
      return jobs.get(jobId)?.git.get(repo) ?? null;
    },
  };
}
