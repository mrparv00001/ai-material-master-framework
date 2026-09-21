"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, Badge, Button } from "@/components/ui";
import { truncate, formatDate } from "@/lib/utils";

export default function MappingsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
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
    if (status) params.set("status", status);
    if (cpseId) params.set("cpseId", cpseId);
    fetch(`/api/mappings?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(d.data));
  }, [page, status, cpseId]);

  async function updateStatus(mappingId: number, newStatus: string) {
    await fetch("/api/mappings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappingId, status: newStatus }),
    });
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "15");
    if (status) params.set("status", status);
    if (cpseId) params.set("cpseId", cpseId);
    const r = await fetch(`/api/mappings?${params.toString()}`);
    const d = await r.json();
    setData(d.data);
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CPSE ↔ National Code Mappings</h1>
        <p className="text-slate-500">Traceability between legacy CPSE codes and common national codes.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Mapping Registry</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="proposed">Proposed</option>
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
                  <th className="px-4 py-3 text-left font-medium text-slate-500">CPSE</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Legacy Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">National Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Approved By</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m: any) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">{m.cpse?.shortCode}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{m.materialMaster?.legacyCode}</td>
                    <td className="px-4 py-3">{truncate(m.materialMaster?.description, 50)}</td>
                    <td className="px-4 py-3 font-mono text-blue-700">{m.standardMaterial?.nationalCode}</td>
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
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {m.approvedBy?.name || "—"}
                      <br />
                      {formatDate(m.approvedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {m.mappingStatus !== "approved" && (
                        <Button
                          onClick={() => updateStatus(m.id, "approved")}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                      )}
                    </td>
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
