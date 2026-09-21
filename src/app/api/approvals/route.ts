import { NextResponse } from "next/server";
import { db } from "@/db";
import { workflowApprovals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc, count, and } from "drizzle-orm";
import type { WorkflowApproval } from "@/db/schema";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const entityType = searchParams.get("entityType");

    const whereClause = and(
      status ? eq(workflowApprovals.status, status as WorkflowApproval["status"]) : undefined,
      entityType ? eq(workflowApprovals.entityType, entityType) : undefined
    );

    const [items, total] = await Promise.all([
      db.query.workflowApprovals.findMany({
        where: whereClause,
        with: { requestedBy: true, reviewer: true },
        orderBy: desc(workflowApprovals.createdAt),
        limit: 50,
      }),
      db.select({ count: count() }).from(workflowApprovals).where(whereClause).then((r) => r[0].count),
    ]);

    return NextResponse.json({ success: true, data: { items, total } });
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

    const [approval] = await db
      .insert(workflowApprovals)
      .values({
        entityType: body.entityType,
        entityId: body.entityId,
        requestedById: user.id,
        reviewerId: body.reviewerId,
        action: body.action || "approve",
        status: "pending_review",
        notes: body.notes,
      })
      .returning();

    return NextResponse.json({ success: true, data: approval });
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

    const [updated] = await db
      .update(workflowApprovals)
      .set({
        reviewerId: user.id,
        status: body.status,
        notes: body.notes,
        resolvedAt: new Date(),
      })
      .where(eq(workflowApprovals.id, body.approvalId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
