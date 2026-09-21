"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0 });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const r = await fetch("/api/approvals?status=pending_review");
    const d = await r.json();
    setData(d.data);
  }

  async function decide(approvalId: number, status: string) {
    await fetch("/api/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, status }),
    });
    load();
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approval Workflow</h1>
        <p className="text-slate-500">Review AI recommendations and mapping changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Requested By</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Notes</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Decision</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No pending approvals.
                    </td>
                  </tr>
                )}
                {data.items.map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{a.entityType}</Badge>
                      <div className="text-xs text-slate-500">ID: {a.entityId}</div>
                    </td>
                    <td className="px-4 py-3">{a.requestedBy?.name}</td>
                    <td className="px-4 py-3">{a.action}</td>
                    <td className="px-4 py-3 text-slate-600">{a.notes || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => decide(a.id, "approved")}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => decide(a.id, "rejected")}
                          className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
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
