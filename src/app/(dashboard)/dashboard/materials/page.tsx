"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Badge, Button } from "@/components/ui";
import { formatDate, truncate } from "@/lib/utils";
import { Search } from "lucide-react";

export default function MaterialsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cpseId, setCpseId] = useState("");
  const [cpseOptions, setCpseOptions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cpse").then((r) => r.json()).then((d) => setCpseOptions(d.data || []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "15");
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (cpseId) params.set("cpseId", cpseId);
    fetch(`/api/materials?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(d.data));
  }, [page, q, status, cpseId]);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Material Masters</h1>
        <p className="text-slate-500">Legacy material codes ingested from participating CPSEs.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Materials</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search description or code…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
                <option value="">All Status</option>
                <option value="proposed">Proposed</option>
                <option value="approved">Approved</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </Select>
              <Select value={cpseId} onChange={(e) => setCpseId(e.target.value)} className="w-48">
                <option value="">All CPSEs</option>
                {cpseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortCode} — {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Legacy Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">CPSE</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">UOM</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">National Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Imported</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m: any) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-700">{m.legacyCode}</td>
                    <td className="px-4 py-3">{truncate(m.description, 55)}</td>
                    <td className="px-4 py-3">{m.cpse?.shortCode}</td>
                    <td className="px-4 py-3">{m.unitOfMeasurement}</td>
                    <td className="px-4 py-3 font-mono text-blue-700">
                      {m.standardMaterial?.nationalCode || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          m.mappingStatus === "approved"
                            ? "success"
                            : m.mappingStatus === "proposed"
                            ? "warning"
                            : m.mappingStatus === "rejected"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {m.mappingStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(m.lastImportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {data.items.length} of {data.total} records
            </p>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button disabled={page * 15 >= data.total} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
