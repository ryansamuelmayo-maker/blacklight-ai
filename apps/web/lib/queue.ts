import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq"

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 60 * 60, // 24 hours
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 60 * 60, // 7 days
  },
}

// ── Queue Definitions ───────────────────────────────────────────────────────

/** AI response generation for Nova and Axel agents */
export const aiResponseQueue = new Queue("ai-response", {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
  },
})

/** Push ADF/XML to CRM endpoints */
export const adfPushQueue = new Queue("adf-push", {
  connection,
  defaultJobOptions,
})

/** Poll CRM systems for lead updates and appraisal values */
export const crmPollQueue = new Queue("crm-poll", {
  connection,
  defaultJobOptions,
})

/** Score lead intent from conversation messages */
export const intentScorerQueue = new Queue("intent-scorer", {
  connection,
  defaultJobOptions,
})

/** Aggregate and compute daily metrics */
export const metricsQueue = new Queue("metrics", {
  connection,
  defaultJobOptions,
})

/** Generate data exports (CSV, JSON, PDF) */
export const exportQueue = new Queue("export", {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
})

// ── Job Helpers ─────────────────────────────────────────────────────────────

export interface AiResponseJobData {
  conversationId: string
  messageId: string
  agentType: "NOVA" | "AXEL"
  leadId: string
  dealershipId: string
  negotiationId?: string
}

export async function addAiResponseJob(data: AiResponseJobData) {
  return aiResponseQueue.add("process", data, {
    priority: 1,
    jobId: `ai-${data.conversationId}-${Date.now()}`,
  })
}

export interface AdfPushJobData {
  dealershipId: string
  leadId: string
  vehicleId: string
  endpointId: string
  adfXml: string
}

export async function addAdfPushJob(data: AdfPushJobData) {
  return adfPushQueue.add("push", data, {
    jobId: `adf-${data.leadId}-${data.endpointId}-${Date.now()}`,
  })
}

export interface CrmPollJobData {
  dealershipId: string
  endpointId: string
  provider: string
}

export async function addCrmPollJob(data: CrmPollJobData) {
  return crmPollQueue.add("poll", data, {
    jobId: `crm-poll-${data.endpointId}`,
  })
}

export interface IntentScorerJobData {
  conversationId: string
  leadId: string
  messageContent: string
  messageRole: string
  responseTimeSeconds?: number
}

export async function addIntentScorerJob(data: IntentScorerJobData) {
  return intentScorerQueue.add("score", data, {
    jobId: `intent-${data.conversationId}-${Date.now()}`,
  })
}

export interface MetricsJobData {
  dealershipId: string
  locationId?: string
  date: string // ISO date string
}

export async function addMetricsJob(data: MetricsJobData) {
  return metricsQueue.add("aggregate", data, {
    jobId: `metrics-${data.dealershipId}-${data.date}`,
  })
}

export interface ExportJobData {
  exportId: string
  dealershipId: string
  userId: string
  exportType: string
  format: string
  filters?: Record<string, unknown>
}

export async function addExportJob(data: ExportJobData) {
  return exportQueue.add("generate", data, {
    jobId: `export-${data.exportId}`,
  })
}
