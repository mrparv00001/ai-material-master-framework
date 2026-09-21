import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  cpseId: number | null;
};

const DEMO_USERS: SessionUser[] = [
  { id: 1, email: "admin@nummf.gov.in", name: "Super Admin", role: "super_admin", cpseId: null },
  { id: 2, email: "reviewer@nummf.gov.in", name: "Dr. Rajesh Kumar", role: "reviewer", cpseId: null },
  { id: 3, email: "ongc@nummf.gov.in", name: "ONGC Data Steward", role: "data_steward", cpseId: 1 },
  { id: 4, email: "viewer@nummf.gov.in", name: "Guest Viewer", role: "viewer", cpseId: null },
];

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const demoUserId = cookieStore.get("demo_user_id")?.value;
  if (demoUserId) {
    const user = DEMO_USERS.find((u) => u.id === Number(demoUserId));
    if (user) return user;
  }
  // Fallback to first real user if seeded
  const first = await db.query.users.findFirst();
  if (first) {
    return {
      id: first.id,
      email: first.email,
      name: first.name,
      role: first.role,
      cpseId: first.cpseId,
    };
  }
  return DEMO_USERS[0];
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function switchDemoUser(userId: number): Promise<SessionUser | null> {
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) return null;
  const cookieStore = await cookies();
  cookieStore.set("demo_user_id", String(userId), { path: "/", maxAge: 60 * 60 * 24 });
  return user;
}

export async function getUserById(id: number) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
