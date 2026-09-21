import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { assertDatabaseUrl } from "@/db";

export async function POST() {
  try {
    assertDatabaseUrl();
    const result = await seedDatabase();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
}
