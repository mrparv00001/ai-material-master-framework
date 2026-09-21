"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";
import { formatNumber, truncate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, Box, CheckCircle, GitCompare, Layers, Building2 } from "lucide-react";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-slate-500">Loading dashboard…</div>;
  }

  const { counts, cpseBreakdown, topMatches } = data;

  const stats = [
    { label: "CPSEs Onboarded", value: counts.totalCpse, icon: Building2, color: "bg-blue-100 text-blue-700" },
    { label: "Material Masters", value: counts.totalMaterials, icon: Box, color: "bg-indigo-100 text-indigo-700" },
    { label: "National Standards", value: counts.totalStandards, icon: Layers, color: "bg-emerald-100 text-emerald-700" },
    { label: "AI Match Pairs", value: counts.totalMatches, icon: GitCompare, color: "bg-amber-100 text-amber-700" },
    { label: "Approved Mappings", value: counts.approvedMappings, icon: CheckCircle, color: "bg-teal-100 text-teal-700" },
    { label: "Pending Reviews", value: counts.pendingMappings, icon: Activity, color: "bg-rose-100 text-rose-700" },
  ];

  const mappingPie = [
    { name: "Approved", value: counts.approvedMappings },
    { name: "Pending", value: counts.pendingMappings },
  ];

  const matchTypeData = data.matchTypeDistribution || [];

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">National-level material master harmonization overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(s.value)}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Materials per CPSE</CardTitle>
            <CardDescription>Legacy material masters ingested from each CPSE.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cpseBreakdown}>
                  <XAxis dataKey="shortCode" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="materials" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapping Status</CardTitle>
            <CardDescription>Approved vs proposed AI mappings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mappingPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {mappingPie.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Match Types</CardTitle>
            <CardDescription>Distribution of detected duplicate and equivalent types.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchTypeData}
                    dataKey="count"
                    nameKey="matchType"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => (entry.matchType as string).replace(/_/g, " ")}
                  >
                    {matchTypeData.map((_: any, i: number) => (
                      <Cell key={`cell2-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top AI Match Recommendations</CardTitle>
          <CardDescription>Highest-confidence duplicate or equivalent candidates awaiting review.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Confidence</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody>
                {topMatches.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{truncate(m.sourceMaterial?.description, 40)}</div>
                      <div className="text-xs text-slate-500">{m.sourceMaterial?.cpse?.shortCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{truncate(m.targetMaterial?.description, 40)}</div>
                      <div className="text-xs text-slate-500">{m.targetMaterial?.cpse?.shortCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{m.matchType.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          m.confidence === "exact"
                            ? "success"
                            : m.confidence === "high"
                            ? "default"
                            : m.confidence === "medium"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {m.confidence}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{(Number(m.similarityScore) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
