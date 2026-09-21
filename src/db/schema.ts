import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  decimal,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "cpse_admin",
  "data_steward",
  "reviewer",
  "viewer",
]);

export const materialStatusEnum = pgEnum("material_status", [
  "draft",
  "active",
  "inactive",
  "deprecated",
]);

export const mappingStatusEnum = pgEnum("mapping_status", [
  "proposed",
  "pending_review",
  "approved",
  "rejected",
  "superseded",
]);

export const matchConfidenceEnum = pgEnum("match_confidence", [
  "exact",
  "high",
  "medium",
  "low",
]);

export const matchTypeEnum = pgEnum("match_type", [
  "identical",
  "duplicate",
  "near_duplicate",
  "functional_equivalent",
  "specification_match",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "run_match",
  "import",
  "export",
  "login",
  "mapping_update",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  cpseId: integer("cpse_id").references(() => cpseOrganizations.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const cpseOrganizations = pgTable(
  "cpse_organizations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
    sector: varchar("sector", { length: 100 }).notNull(),
    erpSystem: varchar("erp_system", { length: 100 }),
    sapClient: varchar("sap_client", { length: 20 }),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("cpse_sector_idx").on(table.sector)]
);

export const classificationTaxonomy = pgTable("classification_taxonomy", {
  id: serial("id").primaryKey(),
  segment: varchar("segment", { length: 100 }).notNull(),
  family: varchar("family", { length: 100 }).notNull(),
  class: varchar("class", { length: 100 }).notNull(),
  commodity: varchar("commodity", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const standardMaterials = pgTable(
  "standard_materials",
  {
    id: serial("id").primaryKey(),
    nationalCode: varchar("national_code", { length: 50 }).notNull().unique(),
    unifiedDescription: text("unified_description").notNull(),
    longDescription: text("long_description"),
    technicalSpecifications: jsonb("technical_specifications").notNull().default({}),
    unitOfMeasurement: varchar("unit_of_measurement", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    subCategory: varchar("sub_category", { length: 100 }),
    taxonomyId: integer("taxonomy_id").references(() => classificationTaxonomy.id),
    manufacturerPartNumber: varchar("manufacturer_part_number", { length: 100 }),
    industryStandards: jsonb("industry_standards"),
    status: materialStatusEnum("status").notNull().default("active"),
    harmonizedOn: timestamp("harmonized_on", { mode: "date" }),
    createdById: integer("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("std_category_idx").on(table.category),
    index("std_status_idx").on(table.status),
  ]
);

export const materialMasters = pgTable(
  "material_masters",
  {
    id: serial("id").primaryKey(),
    cpseId: integer("cpse_id")
      .notNull()
      .references(() => cpseOrganizations.id),
    legacyCode: varchar("legacy_code", { length: 100 }).notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    technicalSpecifications: jsonb("technical_specifications").notNull().default({}),
    unitOfMeasurement: varchar("unit_of_measurement", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }),
    subCategory: varchar("sub_category", { length: 100 }),
    manufacturerPartNumber: varchar("manufacturer_part_number", { length: 100 }),
    plantCode: varchar("plant_code", { length: 50 }),
    valuationClass: varchar("valuation_class", { length: 50 }),
    status: materialStatusEnum("status").notNull().default("active"),
    standardMaterialId: integer("standard_material_id").references(
      () => standardMaterials.id
    ),
    mappingStatus: mappingStatusEnum("mapping_status").notNull().default("proposed"),
    lastImportedAt: timestamp("last_imported_at", { mode: "date" }).notNull().defaultNow(),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("cpse_legacy_code_unique").on(table.cpseId, table.legacyCode),
    index("mm_cpse_idx").on(table.cpseId),
    index("mm_status_idx").on(table.mappingStatus),
    index("mm_standard_idx").on(table.standardMaterialId),
  ]
);

export const matchingJobs = pgTable(
  "matching_jobs",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
    scope: jsonb("scope").notNull(), // { cpseIds?: number[], category?: string }
    algorithmConfig: jsonb("algorithm_config").notNull().default({}),
    totalMaterials: integer("total_materials").notNull().default(0),
    processedMaterials: integer("processed_materials").notNull().default(0),
    matchPairsFound: integer("match_pairs_found").notNull().default(0),
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdById: integer("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("mj_status_idx").on(table.status)]
);

export const matchingResults = pgTable(
  "matching_results",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => matchingJobs.id),
    sourceMaterialId: integer("source_material_id")
      .notNull()
      .references(() => materialMasters.id),
    targetMaterialId: integer("target_material_id")
      .notNull()
      .references(() => materialMasters.id),
    targetStandardId: integer("target_standard_id").references(
      () => standardMaterials.id
    ),
    matchType: matchTypeEnum("match_type").notNull(),
    confidence: matchConfidenceEnum("confidence").notNull(),
    similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }).notNull(),
    attributeScores: jsonb("attribute_scores").notNull().default({}),
    recommendationReason: text("recommendation_reason"),
    status: mappingStatusEnum("status").notNull().default("proposed"),
    reviewedById: integer("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("match_pair_unique").on(table.jobId, table.sourceMaterialId, table.targetMaterialId),
    index("mr_job_idx").on(table.jobId),
    index("mr_source_idx").on(table.sourceMaterialId),
    index("mr_confidence_idx").on(table.confidence),
    index("mr_status_idx").on(table.status),
  ]
);

export const materialMappings = pgTable(
  "material_mappings",
  {
    id: serial("id").primaryKey(),
    cpseId: integer("cpse_id")
      .notNull()
      .references(() => cpseOrganizations.id),
    materialMasterId: integer("material_master_id")
      .notNull()
      .references(() => materialMasters.id),
    standardMaterialId: integer("standard_material_id")
      .notNull()
      .references(() => standardMaterials.id),
    mappingStatus: mappingStatusEnum("status").notNull().default("proposed"),
    mappingType: varchar("mapping_type", { length: 50 }).notNull().default("ai_recommended"),
    effectiveFrom: timestamp("effective_from", { mode: "date" }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "date" }),
    approvedById: integer("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    migrationBatchId: varchar("migration_batch_id", { length: 100 }),
    createdById: integer("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("cpse_material_standard_unique").on(
      table.cpseId,
      table.materialMasterId,
      table.standardMaterialId
    ),
    index("map_cpse_idx").on(table.cpseId),
    index("map_status_idx").on(table.mappingStatus),
  ]
);

export const workflowApprovals = pgTable(
  "workflow_approvals",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'matching_result' | 'material_mapping' | 'standard_material'
    entityId: integer("entity_id").notNull(),
    requestedById: integer("requested_by_id")
      .notNull()
      .references(() => users.id),
    reviewerId: integer("reviewer_id").references(() => users.id),
    action: varchar("action", { length: 50 }).notNull(), // 'approve' | 'reject'
    status: mappingStatusEnum("status").notNull().default("pending_review"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
  },
  (table) => [
    index("wa_entity_idx").on(table.entityType, table.entityId),
    index("wa_status_idx").on(table.status),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: integer("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("audit_action_idx").on(table.action), index("audit_created_idx").on(table.createdAt)]
);

export const erpIntegrations = pgTable(
  "erp_integrations",
  {
    id: serial("id").primaryKey(),
    cpseId: integer("cpse_id")
      .notNull()
      .references(() => cpseOrganizations.id),
    systemName: varchar("system_name", { length: 100 }).notNull(),
    integrationType: varchar("integration_type", { length: 50 }).notNull(), // 'sap_rfc' | 'rest_api' | 'sftp' | 'file'
    endpointUrl: text("endpoint_url"),
    authConfig: jsonb("auth_config"),
    lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
    syncDirection: varchar("sync_direction", { length: 50 }).notNull().default("bidirectional"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("erp_cpse_idx").on(table.cpseId)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CpseOrganization = typeof cpseOrganizations.$inferSelect;
export type NewCpseOrganization = typeof cpseOrganizations.$inferInsert;
export type StandardMaterial = typeof standardMaterials.$inferSelect;
export type NewStandardMaterial = typeof standardMaterials.$inferInsert;
export type MaterialMaster = typeof materialMasters.$inferSelect;
export type NewMaterialMaster = typeof materialMasters.$inferInsert;
export type MatchingJob = typeof matchingJobs.$inferSelect;
export type NewMatchingJob = typeof matchingJobs.$inferInsert;
export type MatchingResult = typeof matchingResults.$inferSelect;
export type NewMatchingResult = typeof matchingResults.$inferInsert;
export type MaterialMapping = typeof materialMappings.$inferSelect;
export type NewMaterialMapping = typeof materialMappings.$inferInsert;
export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type NewWorkflowApproval = typeof workflowApprovals.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ErpIntegration = typeof erpIntegrations.$inferSelect;
export type NewErpIntegration = typeof erpIntegrations.$inferInsert;
export type ClassificationTaxonomy = typeof classificationTaxonomy.$inferSelect;
export type NewClassificationTaxonomy = typeof classificationTaxonomy.$inferInsert;

export const cpseOrganizationsRelations = relations(cpseOrganizations, ({ many }) => ({
  materials: many(materialMasters),
  users: many(users),
  integrations: many(erpIntegrations),
}));

export const usersRelations = relations(users, ({ one }) => ({
  cpse: one(cpseOrganizations, { fields: [users.cpseId], references: [cpseOrganizations.id] }),
}));

export const standardMaterialsRelations = relations(standardMaterials, ({ one, many }) => ({
  taxonomy: one(classificationTaxonomy, { fields: [standardMaterials.taxonomyId], references: [classificationTaxonomy.id] }),
  materialMasters: many(materialMasters),
  mappings: many(materialMappings),
}));

export const materialMastersRelations = relations(materialMasters, ({ one, many }) => ({
  cpse: one(cpseOrganizations, { fields: [materialMasters.cpseId], references: [cpseOrganizations.id] }),
  standardMaterial: one(standardMaterials, { fields: [materialMasters.standardMaterialId], references: [standardMaterials.id] }),
  mappings: many(materialMappings),
  sourceMatches: many(matchingResults, { relationName: "sourceMaterial" }),
  targetMatches: many(matchingResults, { relationName: "targetMaterial" }),
}));

export const matchingJobsRelations = relations(matchingJobs, ({ one, many }) => ({
  createdBy: one(users, { fields: [matchingJobs.createdById], references: [users.id] }),
  results: many(matchingResults),
}));

export const matchingResultsRelations = relations(matchingResults, ({ one }) => ({
  job: one(matchingJobs, { fields: [matchingResults.jobId], references: [matchingJobs.id] }),
  sourceMaterial: one(materialMasters, { fields: [matchingResults.sourceMaterialId], references: [materialMasters.id] }),
  targetMaterial: one(materialMasters, { fields: [matchingResults.targetMaterialId], references: [materialMasters.id] }),
  targetStandard: one(standardMaterials, { fields: [matchingResults.targetStandardId], references: [standardMaterials.id] }),
  reviewer: one(users, { fields: [matchingResults.reviewedById], references: [users.id] }),
}));

export const materialMappingsRelations = relations(materialMappings, ({ one }) => ({
  cpse: one(cpseOrganizations, { fields: [materialMappings.cpseId], references: [cpseOrganizations.id] }),
  materialMaster: one(materialMasters, { fields: [materialMappings.materialMasterId], references: [materialMasters.id] }),
  standardMaterial: one(standardMaterials, { fields: [materialMappings.standardMaterialId], references: [standardMaterials.id] }),
  approvedBy: one(users, { fields: [materialMappings.approvedById], references: [users.id] }),
  createdBy: one(users, { fields: [materialMappings.createdById], references: [users.id] }),
}));

export const workflowApprovalsRelations = relations(workflowApprovals, ({ one }) => ({
  requestedBy: one(users, { fields: [workflowApprovals.requestedById], references: [users.id] }),
  reviewer: one(users, { fields: [workflowApprovals.reviewerId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const erpIntegrationsRelations = relations(erpIntegrations, ({ one }) => ({
  cpse: one(cpseOrganizations, { fields: [erpIntegrations.cpseId], references: [cpseOrganizations.id] }),
}));

export const classificationTaxonomyRelations = relations(classificationTaxonomy, ({ many }) => ({
  standardMaterials: many(standardMaterials),
}));
