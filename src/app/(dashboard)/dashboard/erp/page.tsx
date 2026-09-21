"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select } from "@/components/ui";
import { RefreshCw, CheckCircle } from "lucide-react";

export default function ErpPage() {
  const [cpseId, setCpseId] = useState("");
  const [cpseOptions, setCpseOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/cpse").then((r) => r.json()).then((d) => setCpseOptions(d.data || []));
  }, []);

  async function sync() {
    if (!cpseId) return;
    setLoading(true);
    const r = await fetch("/api/erp/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpseId: Number(cpseId) }),
    });
    const d = await r.json();
    setResult(d);
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ERP / SAP Integration</h1>
        <p className="text-slate-500">Push approved national code mappings back to CPSE ERP systems.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync to ERP</CardTitle>
            <CardDescription>
              Simulated SAP RFC / REST payload containing approved mappings for the selected CPSE.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={cpseId} onChange={(e) => setCpseId(e.target.value)}>
              <option value="">Select CPSE</option>
              {cpseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortCode} — {c.name}
                </option>
              ))}
            </Select>
            <Button onClick={sync} disabled={loading || !cpseId} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing…" : "Push to ERP"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-800">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">{result.data?.system}</p>
                    <p className="text-sm">{result.data?.recordsPushed} records pushed</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Sample Payload</p>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300">
                    {JSON.stringify(result.data?.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Run a sync to view payload and status.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
