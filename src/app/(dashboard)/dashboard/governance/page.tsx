"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { ShieldCheck, Users, FileCheck, History } from "lucide-react";

const policies = [
  {
    title: "Role-Based Access Control",
    desc: "Super Admin, CPSE Admin, Data Steward, Reviewer and Viewer roles with scoped permissions.",
    icon: Users,
  },
  {
    title: "Four-Eyes Approval",
    desc: "Every AI-generated mapping requires reviewer validation before it becomes the approved national standard.",
    icon: FileCheck,
  },
  {
    title: "Immutable Audit Log",
    desc: "All create, update, approve, reject and import actions are recorded with user, timestamp and diff.",
    icon: History,
  },
  {
    title: "Data Quality SLAs",
    desc: "Standardized descriptions, taxonomy classification and UOM normalization enforce master data quality.",
    icon: ShieldCheck,
  },
];

export default function GovernancePage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Governance Framework</h1>
        <p className="text-slate-500">Controls that ensure trustworthy and auditable material master harmonization.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {policies.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <p.icon className="h-5 w-5" />
                </div>
                <CardTitle>{p.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-slate-600">{p.desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
