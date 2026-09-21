import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialMasters, matchingJobs, matchingResults, standardMaterials } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { batchCompare, compareMaterials } from "@/lib/ai/matcher";
import { eq, inArray, and } from "drizzle-orm";
import type { MatchResult } from "@/lib/ai/matcher";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const cpseIds: number[] | undefined = body.cpseIds;
    const minScore = Number(body.minScore ?? 0.55);
    const crossCpseOnly = body.crossCpseOnly ?? false;

    const whereClause = cpseIds?.length ? inArray(materialMasters.cpseId, cpseIds) : undefined;
    const materials = await db.query.materialMasters.findMany({
      where: whereClause,
      with: { cpse: true },
    });

    if (materials.length < 2) {
      return NextResponse.json(
        { success: false, message: "Need at least 2 materials to match" },
        { status: 400 }
      );
    }

    const [job] = await db
      .insert(matchingJobs)
      .values({
        name: body.name || `AI Match Run ${new Date().toLocaleString("en-IN")}`,
        status: "running",
        scope: { cpseIds, minScore, crossCpseOnly },
        totalMaterials: materials.length,
        createdById: user.id,
      })
      .returning();

    const candidates = materials.map((m) => ({
      id: m.id,
      description: m.description,
      longDescription: m.longDescription,
      technicalSpecifications: m.technicalSpecifications as Record<string, unknown>,
      unitOfMeasurement: m.unitOfMeasurement,
      category: m.category,
      manufacturerPartNumber: m.manufacturerPartNumber,
    }));

    let results: MatchResult[] = [];
    if (crossCpseOnly) {
      for (let i = 0; i < materials.length; i++) {
        for (let j = i + 1; j < materials.length; j++) {
          if (materials[i].cpseId === materials[j].cpseId) continue;
          const r = compareMaterials(candidates[i], candidates[j]);
          if (r.similarityScore >= minScore) results.push(r);
        }
      }
    } else {
      results = batchCompare(candidates, candidates, { minScore });
    }

    // Deduplicate symmetric pairs
    const seen = new Set<string>();
    const uniqueResults: MatchResult[] = [];
    results.forEach((r) => {
      const key = [r.sourceId, r.targetId].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(r);
      }
    });
    uniqueResults.sort((a, b) => b.similarityScore - a.similarityScore);

    const inserts = uniqueResults.map((r) => ({
      jobId: job.id,
      sourceMaterialId: r.sourceId,
      targetMaterialId: r.targetId,
      matchType: r.matchType,
      confidence: r.confidence,
      similarityScore: String(r.similarityScore),
      attributeScores: r.attributeScores,
      recommendationReason: r.recommendationReason,
      status: "proposed" as const,
    }));

    if (inserts.length > 0) {
      await db.insert(matchingResults).values(inserts);
    }

    await db
      .update(matchingJobs)
      .set({
        status: "completed",
        processedMaterials: materials.length,
        matchPairsFound: inserts.length,
        completedAt: new Date(),
      })
      .where(eq(matchingJobs.id, job.id));

    return NextResponse.json({
      success: true,
      data: { jobId: job.id, matchesFound: inserts.length },
    });
  } catch (error) {
    console.error("Matching run error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
