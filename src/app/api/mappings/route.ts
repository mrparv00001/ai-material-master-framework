import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialMappings, materialMasters } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and, desc, count, ilike } from "drizzle-orm";
import type { MaterialMapping } from "@/db/schema";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const cpseId = searchParams.get("cpseId");

    const whereClause = and(
      status ? eq(materialMappings.mappingStatus, status as MaterialMapping["mappingStatus"]) : undefined,
      cpseId ? eq(materialMappings.cpseId, Number(cpseId)) : undefined
    );

    const [items, total] = await Promise.all([
      db.query.materialMappings.findMany({
        where: whereClause,
        with: {
          cpse: true,
          materialMaster: { with: { cpse: true } },
          standardMaterial: true,
          approvedBy: true,
        },
        orderBy: desc(materialMappings.updatedAt),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(materialMappings).where(whereClause).then((r) => r[0].count),
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

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { mappingId, status, notes } = body;

    const [updated] = await db
      .update(materialMappings)
      .set({
        mappingStatus: status,
        approvedById: status === "approved" ? user.id : null,
        approvedAt: status === "approved" ? new Date() : null,
      })
      .where(eq(materialMappings.id, mappingId))
      .returning();

    if (updated) {
      await db
        .update(materialMasters)
        .set({ mappingStatus: status })
        .where(eq(materialMasters.id, updated.materialMasterId));
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
