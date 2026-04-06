import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Blacklight AI database...")

  // Dealership
  const dealership = await prisma.dealership.create({
    data: {
      name: "Premier Auto Group",
      slug: "premier-auto-group",
      address: "1234 Auto Drive, Springfield, IL 62701",
      phone: "(555) 100-2000",
      timezone: "America/Chicago",
      subscriptionTier: "GROWTH",
      settings: {
        businessHours: {
          monday: { open: "09:00", close: "19:00" },
          tuesday: { open: "09:00", close: "19:00" },
          wednesday: { open: "09:00", close: "19:00" },
          thursday: { open: "09:00", close: "19:00" },
          friday: { open: "09:00", close: "19:00" },
          saturday: { open: "09:00", close: "17:00" },
          sunday: null,
        },
        defaultChannels: ["SMS", "EMAIL", "WEBCHAT"],
      },
    },
  })

  // Locations
  const mainLocation = await prisma.location.create({
    data: {
      dealershipId: dealership.id,
      name: "Premier Auto — Springfield Main",
      address: "1234 Auto Drive, Springfield, IL 62701",
      phone: "(555) 100-2001",
      isPrimary: true,
    },
  })

  const secondLocation = await prisma.location.create({
    data: {
      dealershipId: dealership.id,
      name: "Premier Auto — Decatur",
      address: "5678 Dealer Lane, Decatur, IL 62521",
      phone: "(555) 100-2002",
    },
  })

  // Users (password hash is bcrypt of "blacklight123")
  const passwordHash = "$2b$10$K4GBqK0T4YTH0YhRqZ3J7eXjQ5Z9Y5Q5Z9Y5Q5Z9Y5Q5Z9Y5Q5"

  const owner = await prisma.user.create({
    data: {
      dealershipId: dealership.id,
      email: "john@premierauto.com",
      name: "John Miller",
      passwordHash,
      role: "OWNER",
      phone: "(555) 100-0001",
    },
  })

  const manager = await prisma.user.create({
    data: {
      dealershipId: dealership.id,
      email: "sarah.w@premierauto.com",
      name: "Sarah Williams",
      passwordHash,
      role: "MANAGER",
      phone: "(555) 100-0002",
    },
  })

  const agent = await prisma.user.create({
    data: {
      dealershipId: dealership.id,
      email: "m.chen@premierauto.com",
      name: "Michael Chen",
      passwordHash,
      role: "AGENT",
      phone: "(555) 100-0003",
    },
  })

  // Negotiation Profiles
  const trucksProfile = await prisma.negotiationProfile.create({
    data: {
      dealershipId: dealership.id,
      name: "Trucks Aggressive",
      vehicleCategory: "TRUCK_SUV",
      isDefault: true,
      defaultOpeningPercent: 82,
      defaultIncrement: 30000,
      defaultCurve: "DECREASING",
      defaultMaxRounds: 5,
      defaultFinalBump: 50000,
      defaultReconBuffer: 0,
      defaultDemandBonus: 20000,
      competitorResponseRules: [
        { competitor: "CarMax", threatLevel: "HIGH", responseStrategy: "differentiate_on_certainty", maxMatchAmount: 50000 },
        { competitor: "Carvana", threatLevel: "MEDIUM", responseStrategy: "highlight_convenience", maxMatchAmount: 30000 },
        { competitor: "Vroom", threatLevel: "LOW", responseStrategy: "acknowledge_and_hold", maxMatchAmount: 0 },
      ],
      escalationRules: { autoEscalateOnCompetitorExceedCeiling: true, autoEscalateOnFinalBumpDeclined: true },
    },
  })

  const sedansProfile = await prisma.negotiationProfile.create({
    data: {
      dealershipId: dealership.id,
      name: "Sedans Conservative",
      vehicleCategory: "SEDAN",
      defaultOpeningPercent: 88,
      defaultIncrement: 20000,
      defaultCurve: "FLAT",
      defaultMaxRounds: 4,
      defaultFinalBump: 30000,
      competitorResponseRules: [
        { competitor: "CarMax", threatLevel: "HIGH", responseStrategy: "match_if_within_ceiling", maxMatchAmount: 30000 },
      ],
    },
  })

  const luxuryProfile = await prisma.negotiationProfile.create({
    data: {
      dealershipId: dealership.id,
      name: "Luxury Premium",
      vehicleCategory: "LUXURY",
      defaultOpeningPercent: 85,
      defaultIncrement: 50000,
      defaultCurve: "FRONT_LOADED",
      defaultMaxRounds: 6,
      defaultFinalBump: 75000,
      defaultReconBuffer: 50000,
      defaultDemandBonus: 30000,
      competitorResponseRules: [
        { competitor: "CarMax", threatLevel: "HIGH", responseStrategy: "premium_experience_pitch", maxMatchAmount: 75000 },
        { competitor: "Carvana", threatLevel: "MEDIUM", responseStrategy: "convenience_plus_premium", maxMatchAmount: 50000 },
      ],
    },
  })

  // ADF Endpoints
  await prisma.adfEndpoint.createMany({
    data: [
      { dealershipId: dealership.id, provider: "KBB_ICO", endpointType: "EMAIL", endpointValue: "leads@kbb-ico.example.com", weight: 50, lastSyncStatus: "SUCCESS", lastSyncAt: new Date() },
      { dealershipId: dealership.id, provider: "ACCUTRADE", endpointType: "EMAIL", endpointValue: "leads@accutrade.example.com", weight: 30, lastSyncStatus: "SUCCESS", lastSyncAt: new Date() },
    ],
  })

  // Sample Leads
  const leads = await Promise.all([
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Sarah", lastName: "Johnson", email: "sarah.j@email.com", phone: "+15551234567", type: "BUYER", source: "CARS_COM", channel: "SMS", status: "HOT", intentScore: 85, assignedAgent: "NOVA", estimatedGross: 320000, intentSignals: [{ signal: "Specific vehicle inquiry", delta: 20, time: new Date().toISOString() }, { signal: "Timeline mention: this weekend", delta: 15, time: new Date().toISOString() }] } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Mike", lastName: "Thompson", email: "mike.t@email.com", phone: "+15552345678", type: "SELLER", source: "WEBSITE_CHAT", channel: "SMS", status: "AI_ENGAGED", intentScore: 72, assignedAgent: "AXEL", estimatedGross: 450000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Jessica", lastName: "Chen", email: "jessica.c@email.com", phone: "+15553456789", type: "BOTH", source: "AUTOTRADER", channel: "EMAIL", status: "APPOINTMENT_SET", intentScore: 91, assignedAgent: "NOVA", estimatedGross: 280000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Robert", lastName: "Davis", email: "robert.d@email.com", phone: "+15554567890", type: "SELLER", source: "SMS_INBOUND", channel: "SMS", status: "AI_ENGAGED", intentScore: 65, assignedAgent: "AXEL", estimatedGross: 380000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: secondLocation.id, firstName: "Amanda", lastName: "Wilson", email: "amanda.w@email.com", phone: "+15555678901", type: "BUYER", source: "FACEBOOK", channel: "SMS", status: "NEW", intentScore: 58, assignedAgent: "NOVA", estimatedGross: 520000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: secondLocation.id, firstName: "James", lastName: "Brown", email: "james.b@email.com", phone: "+15556789012", type: "BUYER", source: "CARGURUS", channel: "WEBCHAT", status: "NEW", intentScore: 44, assignedAgent: "NOVA", estimatedGross: 220000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Patricia", lastName: "Martinez", email: "patricia.m@email.com", phone: "+15557890123", type: "SELLER", source: "EMAIL_ADF", channel: "EMAIL", status: "HOT", intentScore: 78, assignedAgent: "AXEL", estimatedGross: 310000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "David", lastName: "Lee", email: "david.l@email.com", phone: "+15558901234", type: "BUYER", source: "WALKIN", channel: "MANUAL", status: "SHOWED", intentScore: 92, assignedAgent: "NOVA", estimatedGross: 260000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Tom", lastName: "Wilson", email: "tom.w@email.com", phone: "+15559012345", type: "SELLER", source: "WEBSITE_CHAT", channel: "SMS", status: "CLOSED_WON", intentScore: 95, assignedAgent: "AXEL", estimatedGross: 350000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: secondLocation.id, firstName: "Lisa", lastName: "Park", email: "lisa.p@email.com", phone: "+15550123456", type: "BUYER", source: "CARS_COM", channel: "SMS", status: "CLOSED_WON", intentScore: 97, assignedAgent: "NOVA", estimatedGross: 180000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Chris", lastName: "Martin", email: "chris.m@email.com", phone: "+15551112222", type: "BUYER", source: "CARGURUS", channel: "WEBCHAT", status: "AI_ENGAGED", intentScore: 61, assignedAgent: "NOVA", estimatedGross: 310000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Emily", lastName: "Rodriguez", email: "emily.r@email.com", phone: "+15552223333", type: "BUYER", source: "AUTOTRADER", channel: "EMAIL", status: "APPOINTMENT_SET", intentScore: 88, assignedAgent: "NOVA", estimatedGross: 420000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: secondLocation.id, firstName: "Linda", lastName: "Garcia", email: "linda.g@email.com", phone: "+15553334444", type: "SELLER", source: "PHONE", channel: "SMS", status: "CLOSED_LOST", intentScore: 55, assignedAgent: "AXEL", estimatedGross: 160000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Karen", lastName: "Lee", email: "karen.l@email.com", phone: "+15554445555", type: "SELLER", source: "WEBSITE_CHAT", channel: "SMS", status: "AI_ENGAGED", intentScore: 70, assignedAgent: "AXEL", estimatedGross: 260000 } }),
    prisma.lead.create({ data: { dealershipId: dealership.id, locationId: mainLocation.id, firstName: "Steve", lastName: "Adams", email: "steve.a@email.com", phone: "+15555556666", type: "BUYER", source: "OTHER", channel: "MANUAL", status: "STALE", intentScore: 22, assignedAgent: "UNASSIGNED", estimatedGross: 0 } }),
  ])

  // Vehicles for seller leads
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { dealershipId: dealership.id, leadId: leads[1].id, year: 2021, make: "Ford", model: "F-150", trim: "Lariat", vin: "1FTFW1E85MFA54321", mileage: 38500, condition: "GOOD" } }),
    prisma.vehicle.create({ data: { dealershipId: dealership.id, leadId: leads[3].id, year: 2020, make: "Chevrolet", model: "Silverado 1500", trim: "LT", vin: "3GCUYGE77LG876543", mileage: 52000, condition: "GOOD" } }),
    prisma.vehicle.create({ data: { dealershipId: dealership.id, leadId: leads[6].id, year: 2019, make: "Toyota", model: "RAV4", trim: "Limited", vin: "2T3W1RFV0KW543210", mileage: 45000, condition: "EXCELLENT" } }),
    prisma.vehicle.create({ data: { dealershipId: dealership.id, leadId: leads[8].id, year: 2022, make: "BMW", model: "X5", trim: "xDrive40i", vin: "5UXCR6C05N9E12345", mileage: 22000, condition: "EXCELLENT" } }),
    prisma.vehicle.create({ data: { dealershipId: dealership.id, leadId: leads[12].id, year: 2020, make: "Honda", model: "Civic", trim: "EX", vin: "19XFC2F69LE987654", mileage: 61000, condition: "FAIR" } }),
  ])

  // Appraisals
  await Promise.all([
    prisma.appraisal.create({ data: { vehicleId: vehicles[0].id, dealershipId: dealership.id, source: "KBB_ICO", offerAmount: 2150000, confidence: "HIGH", retrievalMethod: "ADF_PUSH" } }),
    prisma.appraisal.create({ data: { vehicleId: vehicles[0].id, dealershipId: dealership.id, source: "ACCUTRADE", offerAmount: 2250000, confidence: "MEDIUM", retrievalMethod: "ADF_PUSH" } }),
    prisma.appraisal.create({ data: { vehicleId: vehicles[1].id, dealershipId: dealership.id, source: "KBB_ICO", offerAmount: 2800000, confidence: "HIGH", retrievalMethod: "ADF_PUSH" } }),
    prisma.appraisal.create({ data: { vehicleId: vehicles[2].id, dealershipId: dealership.id, source: "ACCUTRADE", offerAmount: 2100000, confidence: "HIGH", retrievalMethod: "MANUAL_ENTRY" } }),
    prisma.appraisal.create({ data: { vehicleId: vehicles[3].id, dealershipId: dealership.id, source: "KBB_ICO", offerAmount: 4500000, confidence: "HIGH", retrievalMethod: "ADF_PUSH" } }),
  ])

  // Conversations & Messages
  const conv1 = await prisma.conversation.create({
    data: {
      leadId: leads[0].id,
      dealershipId: dealership.id,
      agent: "NOVA",
      channel: "SMS",
      status: "ACTIVE",
    },
  })

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, role: "CUSTOMER", content: "Hi, I saw the 2024 Toyota Camry XLE on Cars.com (stock #T2441). Is it still available?", channel: "SMS" },
      { conversationId: conv1.id, role: "AI", content: "Hi Sarah! Yes, the 2024 Camry XLE in Celestial Silver is absolutely still available — great choice! Are you looking to come in this week?", channel: "SMS", aiModel: "claude-sonnet-4-20250514", aiReasoningTrace: { intentScore: 45, intentDelta: "+20", strategy: "Qualify and redirect to appointment", sentiment: "positive", guardrailStatus: "compliant" } },
      { conversationId: conv1.id, role: "CUSTOMER", content: "Yes! I'm hoping to buy something this weekend. What's the best price you can do?", channel: "SMS" },
      { conversationId: conv1.id, role: "AI", content: "That's fantastic timing! We have great financing options. I'd love to put together a personalized offer when you come in. Would Saturday morning work for a test drive?", channel: "SMS", aiModel: "claude-sonnet-4-20250514", aiReasoningTrace: { intentScore: 75, intentDelta: "+30", strategy: "Redirect price to in-person, push appointment", sentiment: "positive", guardrailsActive: ["no-price-over-text"], guardrailStatus: "compliant" } },
      { conversationId: conv1.id, role: "CUSTOMER", content: "Saturday at 10am works! Can I test drive it then? Also, I might want to trade in my 2019 Honda Accord.", channel: "SMS" },
    ],
  })

  const conv2 = await prisma.conversation.create({
    data: {
      leadId: leads[1].id,
      dealershipId: dealership.id,
      agent: "AXEL",
      channel: "SMS",
      status: "ACTIVE",
    },
  })

  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, role: "CUSTOMER", content: "I want to sell my F-150. What can you offer?", channel: "SMS" },
      { conversationId: conv2.id, role: "AI", content: "Hi Mike! Based on our current market analysis for your 2021 F-150 Lariat with 38,500 miles, I can offer you $18,700 today.", channel: "SMS", aiModel: "claude-sonnet-4-20250514", aiReasoningTrace: { strategy: "Opening at 85%", guardrailStatus: "compliant", round: 1 } },
      { conversationId: conv2.id, role: "CUSTOMER", content: "That seems low. CarMax offered me $19,200. Can you match that?", channel: "SMS" },
      { conversationId: conv2.id, role: "AI", content: "I appreciate you sharing that. CarMax offers are often contingent on in-person inspection. With us, the price you see is the price you get. I can come up to $18,500.", channel: "SMS", aiModel: "claude-sonnet-4-20250514", aiReasoningTrace: { strategy: "Competitor detected (CarMax) — differentiate on certainty", guardrailStatus: "compliant", round: 2, competitorDetected: "CarMax" } },
    ],
  })

  // Negotiations
  const neg1 = await prisma.negotiation.create({
    data: {
      leadId: leads[1].id,
      vehicleId: vehicles[0].id,
      dealershipId: dealership.id,
      locationId: mainLocation.id,
      status: "ACTIVE",
      strategyProfileId: trucksProfile.id,
      anchorSource: "BLENDED",
      anchorAmount: 2200000,
      dealerCeiling: 2200000,
      openingOfferPercent: 82,
      perRoundIncrement: 30000,
      incrementCurve: "DECREASING",
      maxRounds: 5,
      finalBump: 50000,
      currentRound: 2,
      currentOffer: 1850000,
      customerCounterOffer: 2100000,
      competitorMentioned: "CarMax",
      competitorOfferAmount: 1920000,
    },
  })

  await prisma.negotiationRound.createMany({
    data: [
      { negotiationId: neg1.id, roundNumber: 1, offerAmount: 1870000, incrementApplied: 0, percentOfCeiling: 85, strategyUsed: "Opening at 85%", customerResponse: "That seems low, CarMax offered $19,200", customerSentiment: "NEGATIVE", competitorDetected: true, aiReasoningTrace: {} },
      { negotiationId: neg1.id, roundNumber: 2, offerAmount: 1850000, incrementApplied: -20000, percentOfCeiling: 84, strategyUsed: "Competitor detected — hold position, differentiate on certainty", competitorDetected: true, aiReasoningTrace: {} },
    ],
  })

  // Closed negotiation
  const neg2 = await prisma.negotiation.create({
    data: {
      leadId: leads[8].id,
      vehicleId: vehicles[3].id,
      dealershipId: dealership.id,
      locationId: mainLocation.id,
      status: "CLOSED_WON",
      strategyProfileId: luxuryProfile.id,
      anchorSource: "KBB_ICO",
      anchorAmount: 4500000,
      dealerCeiling: 4500000,
      openingOfferPercent: 85,
      perRoundIncrement: 50000,
      maxRounds: 6,
      finalBump: 75000,
      currentRound: 3,
      currentOffer: 4150000,
      finalOffer: 4150000,
      closedAt: new Date(),
      closedReason: "ACCEPTED",
      grossProfit: 350000,
      guardianSavings: 350000,
    },
  })

  // Pending approval negotiation
  await prisma.negotiation.create({
    data: {
      leadId: leads[3].id,
      vehicleId: vehicles[1].id,
      dealershipId: dealership.id,
      locationId: mainLocation.id,
      status: "PENDING_APPROVAL",
      strategyProfileId: trucksProfile.id,
      anchorSource: "KBB_ICO",
      anchorAmount: 2800000,
      dealerCeiling: 2800000,
      openingOfferPercent: 82,
      perRoundIncrement: 30000,
      maxRounds: 5,
      currentRound: 4,
      currentOffer: 2650000,
      customerCounterOffer: 2900000,
    },
  })

  // Deal Records
  await prisma.dealRecord.createMany({
    data: [
      { dealershipId: dealership.id, locationId: mainLocation.id, leadId: leads[8].id, negotiationId: neg2.id, vehicleId: vehicles[3].id, type: "ACQUISITION", agent: "AXEL", grossProfit: 350000, guardianSavings: 350000, responseTimeSeconds: 4, totalConversationMessages: 8, totalRounds: 3 },
      { dealershipId: dealership.id, locationId: mainLocation.id, leadId: leads[9].id, vehicleId: vehicles[0].id, type: "SALE", agent: "NOVA", grossProfit: 180000, guardianSavings: 0, responseTimeSeconds: 3, totalConversationMessages: 12 },
    ],
  })

  // 30 days of DailyMetrics
  const now = new Date()
  const metricsData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const baseLeads = Math.floor(Math.random() * 8) + 3
    const buyerPct = 0.6 + Math.random() * 0.2
    metricsData.push({
      dealershipId: dealership.id,
      locationId: mainLocation.id,
      date,
      totalLeadsIn: baseLeads,
      buyerLeads: Math.floor(baseLeads * buyerPct),
      sellerLeads: Math.ceil(baseLeads * (1 - buyerPct)),
      aiEngaged: Math.floor(baseLeads * 0.8),
      appointmentsSet: Math.floor(baseLeads * 0.3),
      showed: Math.floor(baseLeads * 0.2),
      closedWon: Math.floor(baseLeads * 0.12),
      closedLost: Math.floor(baseLeads * 0.05),
      totalGrossProfit: (Math.floor(Math.random() * 500) + 200) * 10000,
      avgGrossPerDeal: (Math.floor(Math.random() * 200) + 150) * 10000,
      avgResponseTimeSeconds: Math.floor(Math.random() * 3) + 3,
      avgIntentScore: Math.floor(Math.random() * 20) + 60,
      guardianSavingsTotal: (Math.floor(Math.random() * 150) + 50) * 10000,
      novaLeadsHandled: Math.floor(baseLeads * 0.6),
      axelNegotiationsRun: Math.floor(baseLeads * 0.3),
      humanEscalations: Math.floor(Math.random() * 2),
      approvalRequests: Math.floor(Math.random() * 3),
    })
  }

  await prisma.dailyMetrics.createMany({ data: metricsData })

  console.log("✅ Seed complete!")
  console.log(`   Dealership: ${dealership.name} (${dealership.slug})`)
  console.log(`   Locations: 2`)
  console.log(`   Users: 3 (owner, manager, agent)`)
  console.log(`   Leads: ${leads.length}`)
  console.log(`   Vehicles: ${vehicles.length}`)
  console.log(`   Conversations: 2 with messages`)
  console.log(`   Negotiations: 3 (active, pending approval, closed)`)
  console.log(`   Negotiation Profiles: 3`)
  console.log(`   Daily Metrics: 30 days`)
  console.log("")
  console.log("   Login credentials:")
  console.log("   Email: john@premierauto.com")
  console.log("   Password: blacklight123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
