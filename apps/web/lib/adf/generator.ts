// ── ADF/XML Generator ───────────────────────────────────────────────────────
// Generates valid ADF/XML documents following the automotive lead data standard.

import type { AdfGeneratorInput, AdfCustomer, AdfVehicle, AdfProvider } from "./schemas"

/**
 * Generate a valid ADF/XML document from structured data.
 */
export function generateAdfXml(input: AdfGeneratorInput): string {
  const requestId = input.requestId || generateRequestId()
  const requestDate = new Date().toISOString()

  const lines: string[] = []

  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push("<?adf version=\"1.0\"?>")
  lines.push("<adf>")
  lines.push(`  <prospect>`)
  lines.push(`    <requestdate>${escapeXml(requestDate)}</requestdate>`)

  // Vehicle (interest)
  lines.push(...generateVehicleXml(input.vehicle, "buy", 4))

  // Trade-in vehicle
  if (input.tradeVehicle) {
    lines.push(...generateVehicleXml(input.tradeVehicle, "trade-in", 4))
  }

  // Customer
  lines.push(...generateCustomerXml(input.customer, 4))

  // Provider
  if (input.provider) {
    lines.push(...generateProviderXml(input.provider, 4))
  }

  // Comments
  if (input.comments) {
    lines.push(`    <comments><![CDATA[${input.comments}]]></comments>`)
  }

  lines.push("  </prospect>")
  lines.push("</adf>")

  return lines.join("\n")
}

// ── Section Generators ──────────────────────────────────────────────────────

function generateVehicleXml(
  vehicle: AdfVehicle,
  interest: string,
  indent: number
): string[] {
  const pad = " ".repeat(indent)
  const lines: string[] = []

  const statusAttr = vehicle.condition ? ` status="${escapeXml(vehicle.condition)}"` : ""
  lines.push(`${pad}<vehicle interest="${escapeXml(interest)}"${statusAttr}>`)

  if (vehicle.year) {
    lines.push(`${pad}  <year>${vehicle.year}</year>`)
  }
  lines.push(`${pad}  <make>${escapeXml(vehicle.make)}</make>`)
  lines.push(`${pad}  <model>${escapeXml(vehicle.model)}</model>`)

  if (vehicle.trim) {
    lines.push(`${pad}  <trim>${escapeXml(vehicle.trim)}</trim>`)
  }
  if (vehicle.vin) {
    lines.push(`${pad}  <vin>${escapeXml(vehicle.vin)}</vin>`)
  }
  if (vehicle.stock) {
    lines.push(`${pad}  <stock>${escapeXml(vehicle.stock)}</stock>`)
  }
  if (vehicle.mileage !== undefined) {
    lines.push(`${pad}  <odometer status="replaced" units="mi">${vehicle.mileage}</odometer>`)
  }
  if (vehicle.color) {
    lines.push(`${pad}  <colorcombination>`)
    lines.push(`${pad}    <colorname>${escapeXml(vehicle.color)}</colorname>`)
    lines.push(`${pad}  </colorcombination>`)
  }
  if (vehicle.price !== undefined) {
    const typeAttr = vehicle.priceType ? ` type="${escapeXml(vehicle.priceType)}"` : ""
    lines.push(`${pad}  <price${typeAttr} currency="USD">${vehicle.price}</price>`)
  }
  if (vehicle.bodyStyle) {
    lines.push(`${pad}  <bodystyle>${escapeXml(vehicle.bodyStyle)}</bodystyle>`)
  }
  if (vehicle.transmission) {
    lines.push(`${pad}  <transmission>${escapeXml(vehicle.transmission)}</transmission>`)
  }

  lines.push(`${pad}</vehicle>`)
  return lines
}

function generateCustomerXml(customer: AdfCustomer, indent: number): string[] {
  const pad = " ".repeat(indent)
  const lines: string[] = []

  lines.push(`${pad}<customer>`)
  lines.push(`${pad}  <contact>`)

  // Name
  lines.push(`${pad}    <name part="first">${escapeXml(customer.firstName)}</name>`)
  lines.push(`${pad}    <name part="last">${escapeXml(customer.lastName)}</name>`)

  // Email
  if (customer.email) {
    lines.push(`${pad}    <email>${escapeXml(customer.email)}</email>`)
  }

  // Phone
  if (customer.phone) {
    const typeAttr = customer.phoneType ? ` type="${escapeXml(customer.phoneType)}"` : ""
    lines.push(`${pad}    <phone${typeAttr}>${escapeXml(customer.phone)}</phone>`)
  }

  // Address
  if (customer.address) {
    lines.push(`${pad}    <address>`)
    if (customer.address.street) {
      lines.push(`${pad}      <street line="1">${escapeXml(customer.address.street)}</street>`)
    }
    if (customer.address.city) {
      lines.push(`${pad}      <city>${escapeXml(customer.address.city)}</city>`)
    }
    if (customer.address.state) {
      lines.push(`${pad}      <regioncode>${escapeXml(customer.address.state)}</regioncode>`)
    }
    if (customer.address.postalCode) {
      lines.push(`${pad}      <postalcode>${escapeXml(customer.address.postalCode)}</postalcode>`)
    }
    if (customer.address.country) {
      lines.push(`${pad}      <country>${escapeXml(customer.address.country)}</country>`)
    }
    lines.push(`${pad}    </address>`)
  }

  lines.push(`${pad}  </contact>`)
  lines.push(`${pad}</customer>`)
  return lines
}

function generateProviderXml(provider: AdfProvider, indent: number): string[] {
  const pad = " ".repeat(indent)
  const lines: string[] = []

  lines.push(`${pad}<provider>`)
  lines.push(`${pad}  <name>${escapeXml(provider.name)}</name>`)

  if (provider.service) {
    lines.push(`${pad}  <service>${escapeXml(provider.service)}</service>`)
  }
  if (provider.url) {
    lines.push(`${pad}  <url>${escapeXml(provider.url)}</url>`)
  }
  if (provider.email) {
    lines.push(`${pad}  <email>${escapeXml(provider.email)}</email>`)
  }
  if (provider.phone) {
    lines.push(`${pad}  <phone>${escapeXml(provider.phone)}</phone>`)
  }
  if (provider.contactName) {
    lines.push(`${pad}  <contact>${escapeXml(provider.contactName)}</contact>`)
  }

  lines.push(`${pad}</provider>`)
  return lines
}

// ── Utilities ───────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `adf-${timestamp}-${random}`
}
