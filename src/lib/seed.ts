import { db } from "@/db";
import {
  users,
  cpseOrganizations,
  classificationTaxonomy,
  standardMaterials,
  materialMasters,
  matchingResults,
  materialMappings,
  matchingJobs,
  auditLogs,
} from "@/db/schema";
import { standardizeMaterial } from "./ai/standardizer";
import { compareMaterials } from "./ai/matcher";
import { generateNationalMaterialCode } from "./utils";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return { seeded: false, message: "Already seeded" };

  // Users
  const [superAdmin] = await db
    .insert(users)
    .values({
      email: "admin@nummf.gov.in",
      name: "Super Admin",
      role: "super_admin",
    })
    .returning();

  const [reviewer] = await db
    .insert(users)
    .values({
      email: "reviewer@nummf.gov.in",
      name: "Dr. Rajesh Kumar",
      role: "reviewer",
    })
    .returning();

  // CPSEs
  const cpseData = [
    { name: "Oil & Natural Gas Corporation", shortCode: "ONGC", sector: "Oil & Gas", erpSystem: "SAP S/4HANA" },
    { name: "Bharat Petroleum Corporation", shortCode: "BPCL", sector: "Oil & Gas", erpSystem: "SAP ECC" },
    { name: "National Thermal Power Corporation", shortCode: "NTPC", sector: "Power", erpSystem: "SAP S/4HANA" },
    { name: "Steel Authority of India", shortCode: "SAIL", sector: "Steel", erpSystem: "Oracle ERP" },
    { name: "Coal India Limited", shortCode: "CIL", sector: "Mining", erpSystem: "SAP ECC" },
    { name: "Bharat Heavy Electricals", shortCode: "BHEL", sector: "Heavy Engineering", erpSystem: "SAP S/4HANA" },
  ];
  const cpseOrgs = await db.insert(cpseOrganizations).values(cpseData).returning();
  const cpseMap = new Map(cpseOrgs.map((c) => [c.shortCode, c.id]));

  // Taxonomy
  const taxonomyRows = [
    { segment: "MRO", family: "Fluid Control", class: "Valves", commodity: "Industrial Valves" },
    { segment: "MRO", family: "Rotating Equipment", class: "Bearings", commodity: "Anti-Friction Bearings" },
    { segment: "CAPEX", family: "Electrical Machines", class: "Motors", commodity: "Induction Motors" },
    { segment: "CAPEX", family: "Electrical Distribution", class: "Cables", commodity: "Power Cables" },
    { segment: "CAPEX", family: "Piping Systems", class: "Pipes", commodity: "Carbon Steel Pipes" },
  ];
  const taxonomies = await db.insert(classificationTaxonomy).values(taxonomyRows).returning();
  const taxonomyMap = new Map(taxonomies.map((t) => [t.class, t.id]));

  // Standard materials
  const stdInputs = [
    {
      description: "Ball Valve Carbon Steel Flanged Class 150 50mm",
      specs: { size: "50mm", pressure_rating: "Class 150", material: "Carbon Steel", end_connection: "Flanged" },
      uom: "NOS",
      category: "Mechanical",
      subCategory: "Valves",
    },
    {
      description: "Deep Groove Ball Bearing SKF 6205-2RS1",
      specs: { bore: "25mm", outer_diameter: "52mm", width: "15mm", type: "Deep Groove" },
      uom: "NOS",
      category: "Mechanical",
      subCategory: "Bearings",
    },
    {
      description: "Three Phase Induction Motor 11kW 415V 1440rpm",
      specs: { power: "11kW", voltage: "415V", speed: "1440rpm", phase: "3" },
      uom: "NOS",
      category: "Electrical",
      subCategory: "Motors",
    },
    {
      description: "XLPE Insulated LT Power Cable 3.5C x 95 sqmm Aluminum",
      specs: { conductor: "Aluminum", cores: "3.5C", area: "95 sqmm", insulation: "XLPE" },
      uom: "M",
      category: "Electrical",
      subCategory: "Cables",
    },
    {
      description: "Carbon Steel Seamless Pipe ASTM A106 Gr.B 4 inch Sch 40",
      specs: { material: "ASTM A106 Gr.B", nominal_size: "4 inch", schedule: "Sch 40", type: "Seamless" },
      uom: "M",
      category: "Piping",
      subCategory: "Pipes & Tubes",
    },
  ];

  const stdMaterials: (typeof standardMaterials.$inferSelect)[] = [];
  for (let i = 0; i < stdInputs.length; i++) {
    const input = stdInputs[i];
    const standardized = standardizeMaterial({
      description: input.description,
      technicalSpecifications: input.specs,
      unitOfMeasurement: input.uom,
    });
    const [sm] = await db
      .insert(standardMaterials)
      .values({
        nationalCode: generateNationalMaterialCode(input.category, i + 1),
        unifiedDescription: standardized.unifiedDescription,
        technicalSpecifications: standardized.normalizedSpecs,
        unitOfMeasurement: input.uom,
        category: input.category,
        subCategory: input.subCategory,
        taxonomyId: taxonomyMap.get(standardized.taxonomyClass),
        industryStandards: standardized.industryStandards,
        status: "active",
        createdById: superAdmin.id,
        harmonizedOn: new Date(),
      })
      .returning();
    stdMaterials.push(sm);
  }

  // Legacy material masters from CPSEs with duplicate/near-duplicate variations
  const legacyRows = [
    { cpse: "ONGC", code: "ONGC-V-1001", desc: "BALL VLV CS FLGD CL150 50MM", uom: "NOS", stdIdx: 0 },
    { cpse: "BPCL", code: "BPCL-VAL-4521", desc: "Ball Valve, Carbon Steel, Flanged, Class 150, 2 Inch", uom: "NOS", stdIdx: 0 },
    { cpse: "NTPC", code: "NTPC-ME-7789", desc: "CS Ball Valve Flanged CL150 Size 50mm", uom: "NOS", stdIdx: 0 },
    { cpse: "SAIL", code: "SAIL-V-0098", desc: "Flanged Ball Valve Carbon Steel Class 150 50 NB", uom: "NOS", stdIdx: 0 },
    { cpse: "BHEL", code: "BHEL- Valve-112", desc: "Ball Valve 50mm CS Flanged ANSI 150#", uom: "NOS", stdIdx: 0 },

    { cpse: "ONGC", code: "ONGC-B-2045", desc: "Ball Bearing SKF 6205 2RS1", uom: "NOS", stdIdx: 1 },
    { cpse: "NTPC", code: "NTPC-BEAR-3301", desc: "Deep Groove Ball Brg 6205-2RS1", uom: "NOS", stdIdx: 1 },
    { cpse: "BHEL", code: "BHEL-BRG-667", desc: "Anti Friction Bearing 6205 2RS", uom: "NOS", stdIdx: 1 },

    { cpse: "NTPC", code: "NTPC-MOT-9912", desc: "3 Phase Induction Motor 11KW 415V", uom: "NOS", stdIdx: 2 },
    { cpse: "BHEL", code: "BHEL-MOT-221", desc: "Electric Motor 11 kW 415 V 3 Phase", uom: "NOS", stdIdx: 2 },

    { cpse: "ONGC", code: "ONGC-CAB-5567", desc: "LT Power Cable XLPE 3.5C x 95 sqmm Al", uom: "M", stdIdx: 3 },
    { cpse: "SAIL", code: "SAIL-CBL-2234", desc: "Aluminium XLPE Cable 95 sqmm 3.5 Core", uom: "M", stdIdx: 3 },

    { cpse: "BPCL", code: "BPCL-PIP-7712", desc: "Seamless Pipe CS ASTM A106 GrB 4 Inch Sch40", uom: "M", stdIdx: 4 },
    { cpse: "CIL", code: "CIL-PIPE-889", desc: "Carbon Steel Pipe 4 inch Sch 40 A106 Gr B", uom: "M", stdIdx: 4 },
    { cpse: "SAIL", code: "SAIL-PIPE-1102", desc: "MS Seamless Pipe 100mm NB Sch 40", uom: "M", stdIdx: 4 },
  ];

  const createdMaterials: (typeof materialMasters.$inferSelect)[] = [];
  for (const row of legacyRows) {
    const cpseId = cpseMap.get(row.cpse)!;
    const std = stdMaterials[row.stdIdx];
    const standardized = standardizeMaterial({
      description: row.desc,
      technicalSpecifications: std.technicalSpecifications as Record<string, unknown>,
      unitOfMeasurement: row.uom,
    });
    const [mm] = await db
      .insert(materialMasters)
      .values({
        cpseId,
        legacyCode: row.code,
        description: row.desc,
        technicalSpecifications: standardized.normalizedSpecs,
        unitOfMeasurement: row.uom,
        category: standardized.category,
        subCategory: standardized.subCategory,
        standardMaterialId: std.id,
        mappingStatus: Math.random() > 0.5 ? "approved" : "proposed",
      })
      .returning();
    createdMaterials.push(mm);

    await db.insert(materialMappings).values({
      cpseId,
      materialMasterId: mm.id,
      standardMaterialId: std.id,
      mappingStatus: mm.mappingStatus,
      mappingType: mm.mappingStatus === "approved" ? "ai_recommended" : "ai_recommended",
      createdById: superAdmin.id,
      approvedById: mm.mappingStatus === "approved" ? reviewer.id : null,
      approvedAt: mm.mappingStatus === "approved" ? new Date() : null,
    });
  }

  // Matching job + results
  const [job] = await db
    .insert(matchingJobs)
    .values({
      name: "Initial AI Harmonization Run",
      status: "completed",
      scope: { cpseIds: cpseOrgs.map((c) => c.id) },
      totalMaterials: createdMaterials.length,
      processedMaterials: createdMaterials.length,
      matchPairsFound: 0,
      completedAt: new Date(),
      createdById: superAdmin.id,
    })
    .returning();

  const matchResults: (typeof matchingResults.$inferInsert)[] = [];
  for (let i = 0; i < createdMaterials.length; i++) {
    for (let j = i + 1; j < createdMaterials.length; j++) {
      const a = createdMaterials[i];
      const b = createdMaterials[j];
      const r = compareMaterials(
        {
          id: a.id,
          description: a.description,
          longDescription: a.longDescription,
          technicalSpecifications: a.technicalSpecifications as Record<string, unknown>,
          unitOfMeasurement: a.unitOfMeasurement,
          category: a.category,
          manufacturerPartNumber: a.manufacturerPartNumber,
        },
        {
          id: b.id,
          description: b.description,
          longDescription: b.longDescription,
          technicalSpecifications: b.technicalSpecifications as Record<string, unknown>,
          unitOfMeasurement: b.unitOfMeasurement,
          category: b.category,
          manufacturerPartNumber: b.manufacturerPartNumber,
        }
      );
      if (r.similarityScore >= 0.55) {
        matchResults.push({
          jobId: job.id,
          sourceMaterialId: a.id,
          targetMaterialId: b.id,
          matchType: r.matchType,
          confidence: r.confidence,
          similarityScore: String(r.similarityScore),
          attributeScores: r.attributeScores,
          recommendationReason: r.recommendationReason,
          status: "proposed",
        });
      }
    }
  }

  if (matchResults.length > 0) {
    await db.insert(matchingResults).values(matchResults);
    await db
      .update(matchingJobs)
      .set({ matchPairsFound: matchResults.length })
      .where(eq(matchingJobs.id, job.id));
  }

  await db.insert(auditLogs).values({
    userId: superAdmin.id,
    action: "create",
    entityType: "system",
    newValues: { event: "seed_database", materials: createdMaterials.length, standards: stdMaterials.length },
  });

  return {
    seeded: true,
    users: 2,
    cpseOrgs: cpseOrgs.length,
    standardMaterials: stdMaterials.length,
    materialMasters: createdMaterials.length,
    matchingResults: matchResults.length,
  };
}
