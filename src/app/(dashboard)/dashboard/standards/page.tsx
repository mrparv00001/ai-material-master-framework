"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Badge, Button } from "@/components/ui";
import { truncate, formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

export default function StandardsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "15");
    if (q) params.set("q", q);
    fetch(`/api/standard-materials?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(d.data));
  }, [page, q]);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Standard Material Master</h1>
        <p className="text-slate-500">Harmonized national material codes and unified descriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>National Codes</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search national code or description…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">National Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Unified Description</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">UOM</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Taxonomy</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Harmonized</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s: any) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{s.nationalCode}</td>
                    <td className="px-4 py-3">{truncate(s.unifiedDescription, 60)}</td>
                    <td className="px-4 py-3">{s.category}</td>
                    <td className="px-4 py-3">{s.unitOfMeasurement}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.taxonomy ? `${s.taxonomy.segment} › ${s.taxonomy.commodity}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.harmonizedOn)}</td>
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
