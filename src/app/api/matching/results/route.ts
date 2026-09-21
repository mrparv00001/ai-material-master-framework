import { NextResponse } from "next/server";
import { db } from "@/db";
import { matchingResults, materialMappings, standardMaterials, materialMasters } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { standardizeMaterial, normalizeUomForStandard } from "@/lib/ai/standardizer";
import { generateNationalMaterialCode } from "@/lib/utils";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import type { MaterialMaster } from "@/db/schema";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const jobId = searchParams.get("jobId");
    const confidence = searchParams.get("confidence");
    const status = searchParams.get("status");

    const whereClause = and(
      jobId ? eq(matchingResults.jobId, Number(jobId)) : undefined,
      confidence ? eq(matchingResults.confidence, confidence as any) : undefined,
      status ? eq(matchingResults.status, status as MaterialMaster["mappingStatus"]) : undefined
    );

    const [items, total] = await Promise.all([
      db.query.matchingResults.findMany({
        where: whereClause,
        with: {
          sourceMaterial: { with: { cpse: true } },
          targetMaterial: { with: { cpse: true } },
          targetStandard: true,
        },
        orderBy: desc(matchingResults.similarityScore),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(matchingResults).where(whereClause).then((r) => r[0].count),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const resultIds: number[] = body.resultIds;
    const action: "approve" | "reject" = body.action;
    const createStandard = body.createStandard ?? true;

    const results = await db.query.matchingResults.findMany({
      where: inArray(matchingResults.id, resultIds),
      with: { sourceMaterial: true, targetMaterial: true },
    });

    const processed: number[] = [];
    for (const result of results) {
      if (!result.sourceMaterial || !result.targetMaterial) continue;

      await db
        .update(matchingResults)
        .set({
          status: action === "approve" ? "approved" : "rejected",
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: body.notes,
        })
        .where(eq(matchingResults.id, result.id));

      if (action === "approve") {
        let standardId = result.targetStandardId;
        if (!standardId && createStandard) {
          const standardized = standardizeMaterial({
            description: result.sourceMaterial.description,
            longDescription: result.sourceMaterial.longDescription,
            technicalSpecifications: result.sourceMaterial.technicalSpecifications as Record<string, unknown>,
            unitOfMeasurement: result.sourceMaterial.unitOfMeasurement,
          });
          const nextIndex = await db
            .select({ count: count() })
            .from(standardMaterials)
            .then((r) => r[0].count + 1);
          const [sm] = await db
            .insert(standardMaterials)
            .values({
              nationalCode: generateNationalMaterialCode(standardized.category, nextIndex),
              unifiedDescription: standardized.unifiedDescription,
              longDescription: result.sourceMaterial.longDescription,
              technicalSpecifications: standardized.normalizedSpecs,
              unitOfMeasurement: normalizeUomForStandard(result.sourceMaterial.unitOfMeasurement),
              category: standardized.category,
              subCategory: standardized.subCategory,
              industryStandards: standardized.industryStandards,
              createdById: user.id,
              harmonizedOn: new Date(),
            })
            .returning();
          standardId = sm.id;
        }

        if (standardId) {
          for (const mm of [result.sourceMaterial, result.targetMaterial]) {
            const exists = await db.query.materialMappings.findFirst({
              where: and(
                eq(materialMappings.materialMasterId, mm.id),
                eq(materialMappings.standardMaterialId, standardId!)
              ),
            });
            if (!exists) {
              await db.insert(materialMappings).values({
                cpseId: mm.cpseId,
                materialMasterId: mm.id,
                standardMaterialId: standardId,
                mappingStatus: "approved",
                mappingType: "ai_recommended",
                createdById: user.id,
                approvedById: user.id,
                approvedAt: new Date(),
              });
            }
            await db
              .update(materialMasters)
              .set({ standardMaterialId: standardId, mappingStatus: "approved" })
              .where(eq(materialMasters.id, mm.id));
          }
        }
      }
      processed.push(result.id);
    }

    return NextResponse.json({ success: true, data: { processed } });
  } catch (error) {
    console.error("Match result action error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
