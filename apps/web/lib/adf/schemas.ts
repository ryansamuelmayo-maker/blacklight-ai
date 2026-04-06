// ── ADF/XML Data Structures ─────────────────────────────────────────────────
// Types for the Auto-lead Data Format (ADF) standard.

export interface AdfCustomer {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  phoneType?: "voice" | "cellphone" | "fax"
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
}

export interface AdfVehicle {
  year: number
  make: string
  model: string
  trim?: string
  vin?: string
  stock?: string
  mileage?: number
  color?: string
  condition?: "new" | "used" | "certified"
  bodyStyle?: string
  transmission?: string
  price?: number
  priceType?: "asking" | "offer" | "msrp" | "invoice"
}

export interface AdfProvider {
  name: string
  service?: string
  url?: string
  email?: string
  phone?: string
  contactName?: string
}

export interface ParsedAdfLead {
  /** Unique request ID from the ADF envelope */
  requestId?: string
  /** Request date from the ADF envelope */
  requestDate?: string
  /** Customer data */
  customer: AdfCustomer
  /** Primary vehicle (interest or trade-in) */
  vehicle: AdfVehicle
  /** Trade-in vehicle, if separate from primary */
  tradeVehicle?: AdfVehicle
  /** Lead source/provider */
  provider?: AdfProvider
  /** Raw comments/notes field */
  comments?: string
  /** Lead source identifier (e.g., "Cars.com", "AutoTrader") */
  source?: string
  /** Raw XML for archival */
  rawXml: string
}

export interface AdfGeneratorInput {
  requestId?: string
  customer: AdfCustomer
  vehicle: AdfVehicle
  tradeVehicle?: AdfVehicle
  provider?: AdfProvider
  comments?: string
}
