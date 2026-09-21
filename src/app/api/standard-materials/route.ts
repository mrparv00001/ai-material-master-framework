import { NextResponse } from "next/server";
import { db } from "@/db";
import { standardMaterials, materialMappings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateNationalMaterialCode } from "@/lib/utils";
import { eq, ilike, or, and, desc, count } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const q = searchParams.get("q") || "";

    const whereClause = q
      ? or(
          ilike(standardMaterials.nationalCode, `%${q}%`),
          ilike(standardMaterials.unifiedDescription, `%${q}%`),
          ilike(standardMaterials.category, `%${q}%`)
        )
      : undefined;

    const [items, total] = await Promise.all([
      db.query.standardMaterials.findMany({
        where: whereClause,
        with: { taxonomy: true },
        orderBy: desc(standardMaterials.updatedAt),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(standardMaterials).where(whereClause).then((r) => r[0].count),
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
    const nextIndex = await db
      .select({ count: count() })
      .from(standardMaterials)
      .then((r) => r[0].count + 1);

    const [sm] = await db
      .insert(standardMaterials)
      .values({
        nationalCode: body.nationalCode || generateNationalMaterialCode(body.category, nextIndex),
        unifiedDescription: body.unifiedDescription,
        longDescription: body.longDescription,
        technicalSpecifications: body.technicalSpecifications || {},
        unitOfMeasurement: body.unitOfMeasurement,
        category: body.category,
        subCategory: body.subCategory,
        taxonomyId: body.taxonomyId,
        manufacturerPartNumber: body.manufacturerPartNumber,
        industryStandards: body.industryStandards || [],
        createdById: user.id,
      })
      .returning();
    return NextResponse.json({ success: true, data: sm });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
