import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialMasters, standardMaterials, cpseOrganizations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, ilike, or, and, desc, count } from "drizzle-orm";
import type { MaterialMaster } from "@/db/schema";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const q = searchParams.get("q") || "";
    const cpseId = searchParams.get("cpseId");
    const status = searchParams.get("status");

    const whereClause = and(
      q
        ? or(
            ilike(materialMasters.description, `%${q}%`),
            ilike(materialMasters.legacyCode, `%${q}%`),
            ilike(materialMasters.category || "", `%${q}%`)
          )
        : undefined,
      cpseId ? eq(materialMasters.cpseId, Number(cpseId)) : undefined,
      status ? eq(materialMasters.mappingStatus, status as MaterialMaster["mappingStatus"]) : undefined
    );

    const [items, total] = await Promise.all([
      db.query.materialMasters.findMany({
        where: whereClause,
        with: { cpse: true, standardMaterial: true },
        orderBy: desc(materialMasters.updatedAt),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(materialMasters).where(whereClause).then((r) => r[0].count),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize },
    });
  } catch (error) {
    console.error("Materials error:", error);
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
    const [mm] = await db
      .insert(materialMasters)
      .values({
        cpseId: body.cpseId,
        legacyCode: body.legacyCode,
        description: body.description,
        longDescription: body.longDescription,
        technicalSpecifications: body.technicalSpecifications || {},
        unitOfMeasurement: body.unitOfMeasurement,
        category: body.category,
        subCategory: body.subCategory,
        manufacturerPartNumber: body.manufacturerPartNumber,
        plantCode: body.plantCode,
      })
      .returning();
    return NextResponse.json({ success: true, data: mm });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
