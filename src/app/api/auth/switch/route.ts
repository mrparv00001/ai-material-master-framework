import { NextResponse } from "next/server";
import { switchDemoUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await switchDemoUser(Number(body.userId));
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Switch failed" },
      { status: 500 }
    );
  }
}
