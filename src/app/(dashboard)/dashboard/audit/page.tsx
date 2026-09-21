"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    fetch(`/api/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(d.data));
  }, [page]);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
        <p className="text-slate-500">Immutable log of all material master changes and governance actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">User</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3">{a.user?.name || "System"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{a.action}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.entityType} {a.entityId ? `#${a.entityId}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <pre className="max-w-xs truncate text-xs text-slate-600">
                        {JSON.stringify(a.newValues)}
                      </pre>
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
              <Button disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
