"use client";

import { useEffect, useState } from "react";
import { Select } from "./ui";
import { User } from "lucide-react";

type UserOption = { id: number; email: string; name: string; role: string };

export function UserSwitcher() {
  const [user, setUser] = useState<UserOption | null>(null);
  const [options] = useState<UserOption[]>([
    { id: 1, email: "admin@nummf.gov.in", name: "Super Admin", role: "super_admin" },
    { id: 2, email: "reviewer@nummf.gov.in", name: "Dr. Rajesh Kumar", role: "reviewer" },
    { id: 3, email: "ongc@nummf.gov.in", name: "ONGC Data Steward", role: "data_steward" },
    { id: 4, email: "viewer@nummf.gov.in", name: "Guest Viewer", role: "viewer" },
  ]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.data));
  }, []);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = Number(e.target.value);
    await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <User className="h-4 w-4 text-slate-500" />
      <Select value={user?.id?.toString() ?? ""} onChange={handleChange} className="h-8 text-xs border-0 bg-transparent shadow-none">
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </Select>
    </div>
  );
}
