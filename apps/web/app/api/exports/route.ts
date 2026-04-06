import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get dealershipId from session
    const dealershipId = "demo" // TODO: from session

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") // ExportStatus
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "25", 10)

    const where: Record<string, unknown> = { dealershipId }
    if (status) where.status = status

    const [exports, total] = await Promise.all([
      prisma.dataExport.findMany({
        where,
        include: {
          requestedByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dataExport.count({ where }),
    ])

    return Response.json({
      exports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("GET /api/exports error:", error)
    return Response.json(
      { error: "Failed to fetch exports" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get dealershipId and userId from session
    const dealershipId = "demo" // TODO: from session
    const userId = "demo-user" // TODO: from session

    const body = await request.json()
    const { exportType, format } = body

    if (!exportType) {
      return Response.json(
        { error: "exportType is required" },
        { status: 400 }
      )
    }

    const validTypes = ["FULL", "LEADS", "CONVERSATIONS", "NEGOTIATIONS", "DEALS", "ANALYTICS"]
    if (!validTypes.includes(exportType)) {
      return Response.json(
        { error: `exportType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    const validFormats = ["CSV", "JSON", "PDF_REPORT"]
    const exportFormat = format ?? "CSV"
    if (!validFormats.includes(exportFormat)) {
      return Response.json(
        { error: `format must be one of: ${validFormats.join(", ")}` },
        { status: 400 }
      )
    }

    const dataExport = await prisma.dataExport.create({
      data: {
        dealershipId,
        requestedByUserId: userId,
        exportType,
        format: exportFormat,
        status: "QUEUED",
        requestedAt: new Date(),
        // Exports expire after 7 days
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // TODO: Queue background job to generate the export file
    // e.g., publishToQueue("export:generate", { exportId: dataExport.id })

    return Response.json(dataExport, { status: 201 })
  } catch (error) {
    console.error("POST /api/exports error:", error)
    return Response.json(
      { error: "Failed to create export" },
      { status: 500 }
    )
  }
}
