"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Select } from "@/components/ui";
import { truncate } from "@/lib/utils";
import { Play, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function MatchingPage() {
  const [results, setResults] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadResults();
  }, [page, statusFilter]);

  async function loadResults() {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "15");
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/matching/results?${params.toString()}`);
    const d = await r.json();
    setResults(d.data);
  }

  async function runMatching() {
    setRunning(true);
    await fetch("/api/matching/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minScore: 0.55, crossCpseOnly: false }),
    });
    setRunning(false);
    loadResults();
  }

  async function act(action: "approve" | "reject") {
    if (selected.length === 0) return;
    await fetch("/api/matching/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultIds: selected, action, createStandard: true }),
    });
    setSelected([]);
    loadResults();
  }

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Material Matching</h1>
          <p className="text-slate-500">Detect duplicates, near-duplicates and functional equivalents.</p>
        </div>
        <Button onClick={runMatching} disabled={running} className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run AI Matcher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Match Recommendations</CardTitle>
              <CardDescription>{results.total} candidate pairs found by the AI engine.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
                <option value="">All</option>
                <option value="proposed">Proposed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
              <Button
                disabled={selected.length === 0}
                onClick={() => act("approve")}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button
                disabled={selected.length === 0}
                onClick={() => act("reject")}
                className="gap-2 bg-rose-600 hover:bg-rose-700"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      onChange={(e) =>
                        setSelected(e.target.checked ? results.items.map((r: any) => r.id) : [])
                      }
                      checked={selected.length === results.items.length && results.items.length > 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Match Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Confidence</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.items.map((m: any) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selected.includes(m.id)}
                        onChange={() => toggle(m.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{truncate(m.sourceMaterial?.description, 38)}</div>
                      <div className="text-xs text-slate-500">{m.sourceMaterial?.cpse?.shortCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{truncate(m.targetMaterial?.description, 38)}</div>
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
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          m.status === "approved" ? "success" : m.status === "rejected" ? "danger" : "warning"
                        }
                      >
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {results.items.length} of {results.total} records
            </p>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button disabled={page * 15 >= results.total} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
