"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select } from "@/components/ui";
import { UploadCloud } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cpseId, setCpseId] = useState("");
  const [cpseOptions, setCpseOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/cpse").then((r) => r.json()).then((d) => setCpseOptions(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !cpseId) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cpseId", cpseId);
    const r = await fetch("/api/upload", { method: "POST", body: formData });
    const d = await r.json();
    setResult(d);
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Import</h1>
        <p className="text-slate-500">Upload legacy material master CSV from a CPSE ERP/SAP extract.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Material Master</CardTitle>
            <CardDescription>
              CSV with columns: description, legacy_code, uom, and any technical specification columns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">CPSE</label>
                <Select value={cpseId} onChange={(e) => setCpseId(e.target.value)}>
                  <option value="">Select CPSE</option>
                  {cpseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortCode} — {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700"
                />
              </div>
              <Button type="submit" disabled={loading || !file || !cpseId} className="gap-2">
                <UploadCloud className="h-4 w-4" />
                {loading ? "Importing…" : "Import Records"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
                  <p className="font-semibold">{result.data?.inserted ?? 0} records imported / updated</p>
                </div>
                {result.data?.errors?.length > 0 && (
                  <div className="rounded-lg bg-rose-50 p-4 text-rose-800">
                    <p className="font-semibold">{result.data.errors.length} errors</p>
                    <ul className="mt-2 max-h-40 overflow-auto text-xs">
                      {result.data.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Import results will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
