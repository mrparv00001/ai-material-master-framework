import { NextResponse } from "next/server";
import { db } from "@/db";
import { erpIntegrations, auditLogs, materialMappings, standardMaterials } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const cpseId = Number(body.cpseId);

    const integration = await db.query.erpIntegrations.findFirst({
      where: and(eq(erpIntegrations.cpseId, cpseId), eq(erpIntegrations.isActive, true)),
    });

    const mappings = await db.query.materialMappings.findMany({
      where: and(
        eq(materialMappings.cpseId, cpseId),
        eq(materialMappings.mappingStatus, "approved")
      ),
      with: { materialMaster: true, standardMaterial: true },
    });

    // Simulated SAP/ERP payload
    const payload = mappings.map((m) => ({
      cpseMaterialCode: m.materialMaster?.legacyCode,
      nationalMaterialCode: m.standardMaterial?.nationalCode,
      nationalDescription: m.standardMaterial?.unifiedDescription,
      effectiveFrom: m.effectiveFrom,
      mappingStatus: m.mappingStatus,
    }));

    await db
      .update(erpIntegrations)
      .set({ lastSyncAt: new Date() })
      .where(eq(erpIntegrations.id, integration?.id ?? 0));

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "export",
      entityType: "erp_sync",
      newValues: { cpseId, system: integration?.systemName || "SAP", records: payload.length },
    });

    return NextResponse.json({
      success: true,
      data: {
        system: integration?.systemName || "SAP ECC",
        recordsPushed: payload.length,
        samplePayload: payload.slice(0, 3),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "ERP sync failed" },
      { status: 500 }
    );
  }
}
