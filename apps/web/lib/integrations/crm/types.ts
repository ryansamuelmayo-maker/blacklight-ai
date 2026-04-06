// ── CRM Adapter Interface ───────────────────────────────────────────────────
// Common interface for integrating with dealership CRM systems.

export interface CrmLeadData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  source?: string
  vehicleOfInterest?: {
    year: number
    make: string
    model: string
    trim?: string
    vin?: string
  }
  tradeVehicle?: {
    year: number
    make: string
    model: string
    mileage?: number
  }
  notes?: string
  appointmentDate?: string
  appointmentTime?: string
}

export interface CrmSyncResult {
  crmRecordId: string
  status: "ACTIVE" | "SOLD" | "LOST" | "PENDING" | "UNKNOWN"
  lastUpdated: Date | null
  rawData?: Record<string, unknown>
}

export interface CrmAppraisalResult {
  value: number | null
  source: string
  expiresAt?: Date
  confidence?: "HIGH" | "MEDIUM" | "LOW"
  rawData?: Record<string, unknown>
}

/**
 * CRM adapter interface that all CRM integrations must implement.
 * Each dealership CRM (DealerSocket, VinSolutions, CDK, etc.) gets its own adapter.
 */
export interface CrmAdapter {
  /** Unique name identifier for this CRM adapter */
  name: string

  /**
   * Retrieve an appraisal value from the CRM for a specific vehicle.
   *
   * @param vehicleId - Internal vehicle ID
   * @param crmRecordId - The CRM's record/deal ID
   * @returns The appraisal amount in cents, or null if unavailable
   */
  getAppraisalValue(
    vehicleId: string,
    crmRecordId: string
  ): Promise<CrmAppraisalResult>

  /**
   * Push a new lead into the CRM system.
   *
   * @param lead - Lead data to push
   * @returns The CRM record ID of the created lead
   */
  pushLead(lead: CrmLeadData): Promise<string>

  /**
   * Sync the status of an existing CRM record.
   *
   * @param recordId - The CRM record ID to check
   * @returns Current sync status
   */
  syncStatus(recordId: string): Promise<CrmSyncResult>

  /**
   * Test the connection to the CRM system.
   *
   * @returns true if the connection is healthy
   */
  testConnection(): Promise<boolean>

  /**
   * Update an existing lead record in the CRM.
   *
   * @param recordId - The CRM record ID to update
   * @param data - Partial lead data to update
   */
  updateLead(
    recordId: string,
    data: Partial<CrmLeadData>
  ): Promise<void>
}

/**
 * Factory type for creating CRM adapter instances.
 */
export type CrmAdapterFactory = (config: {
  apiUrl: string
  apiKey?: string
  username?: string
  password?: string
  dealerId?: string
  credentials?: Record<string, string>
}) => CrmAdapter
