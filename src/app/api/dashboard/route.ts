import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialMasters, standardMaterials, matchingResults, cpseOrganizations, materialMappings } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();

    const [
      totalMaterials,
      totalStandards,
      totalMatches,
      totalCpse,
      totalMappings,
      approvedMappings,
      pendingMappings,
    ] = await Promise.all([
      db.select({ count: count() }).from(materialMasters).then((r) => r[0].count),
      db.select({ count: count() }).from(standardMaterials).then((r) => r[0].count),
      db.select({ count: count() }).from(matchingResults).then((r) => r[0].count),
      db.select({ count: count() }).from(cpseOrganizations).then((r) => r[0].count),
      db.select({ count: count() }).from(materialMappings).then((r) => r[0].count),
      db.select({ count: count() }).from(materialMappings).where(eq(materialMappings.mappingStatus, "approved")).then((r) => r[0].count),
      db.select({ count: count() }).from(materialMappings).where(eq(materialMappings.mappingStatus, "proposed")).then((r) => r[0].count),
    ]);

    const duplicates = await db
      .select({ count: count() })
      .from(matchingResults)
      .where(sql`${matchingResults.matchType} IN ('duplicate','near_duplicate','identical','specification_match')`)
      .then((r) => r[0].count);

    const matchTypeDistribution = await db
      .select({
        matchType: matchingResults.matchType,
        count: count(),
      })
      .from(matchingResults)
      .groupBy(matchingResults.matchType);

    const cpseBreakdown = await db
      .select({
        id: cpseOrganizations.id,
        name: cpseOrganizations.name,
        shortCode: cpseOrganizations.shortCode,
        materials: count(materialMasters.id),
      })
      .from(cpseOrganizations)
      .leftJoin(materialMasters, eq(cpseOrganizations.id, materialMasters.cpseId))
      .groupBy(cpseOrganizations.id, cpseOrganizations.name, cpseOrganizations.shortCode);

    const topMatches = await db.query.matchingResults.findMany({
      with: {
        sourceMaterial: { with: { cpse: true } },
        targetMaterial: { with: { cpse: true } },
      },
      orderBy: (mr, { desc }) => [desc(mr.similarityScore)],
      limit: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          totalMaterials,
          totalStandards,
          totalMatches,
          totalCpse,
          totalMappings,
          approvedMappings,
          pendingMappings,
          duplicates,
        },
        cpseBreakdown,
        topMatches,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Dashboard failed" },
      { status: 500 }
    );
  }
}
