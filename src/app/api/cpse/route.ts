import { NextResponse } from "next/server";
import { db } from "@/db";
import { cpseOrganizations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireUser();
    const orgs = await db.query.cpseOrganizations.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });
    return NextResponse.json({ success: true, data: orgs });
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
    if (!["super_admin", "cpse_admin"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const [org] = await db
      .insert(cpseOrganizations)
      .values({
        name: body.name,
        shortCode: body.shortCode,
        sector: body.sector,
        erpSystem: body.erpSystem,
        sapClient: body.sapClient,
      })
      .returning();
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
