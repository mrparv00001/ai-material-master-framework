import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc, count, and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const whereClause = and(
      action ? eq(auditLogs.action, action as any) : undefined,
      entityType ? eq(auditLogs.entityType, entityType) : undefined
    );

    const [items, total] = await Promise.all([
      db.query.auditLogs.findMany({
        where: whereClause,
        with: { user: true },
        orderBy: desc(auditLogs.createdAt),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(auditLogs).where(whereClause).then((r) => r[0].count),
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
