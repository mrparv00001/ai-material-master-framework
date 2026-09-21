import Link from "next/link";
import { Button } from "@/components/ui";
import {
  Network,
  Brain,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Database,
  Workflow,
  Globe,
  Cpu,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Matching Engine",
    desc: "NLP + cosine similarity to detect identical, duplicate and functionally equivalent materials across CPSE ERPs.",
  },
  {
    icon: Database,
    title: "Common National Code",
    desc: "Auto-generates a standardized National Material Code while preserving legacy CPSE code mappings.",
  },
  {
    icon: Workflow,
    title: "Validation Workflow",
    desc: "Human-in-the-loop review and approval for every AI recommendation with full audit trail.",
  },
  {
    icon: BarChart3,
    title: "Master Data Analytics",
    desc: "Real-time dashboards showing duplication rates, harmonization progress and procurement insights.",
  },
  {
    icon: ShieldCheck,
    title: "Governance & Audit",
    desc: "Immutable audit logs and role-based access for super admins, reviewers and CPSE stewards.",
  },
  {
    icon: Globe,
    title: "SAP / ERP Integration",
    desc: "REST endpoints and sync payloads ready for SAP ECC, S/4HANA and Oracle ERP consumption.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
              N
            </div>
            <span className="font-bold text-slate-900">NUMMF</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/api/seed" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              API
            </Link>
            <Link href="/dashboard">
              <Button className="gap-2">
                Launch Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <Network className="h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            SIH 2026 — One Nation, One Material Code
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            National Unified Material Master Framework
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-blue-100">
            AI-powered harmonization of material master data across Central Public Sector Enterprises.
            Detect duplicates, generate common national codes, and integrate with SAP/ERP — all from a
            single, governable platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <form action="/api/seed" method="POST">
              <Button type="submit" className="gap-2 bg-white text-blue-900 hover:bg-blue-50">
                Seed Demo Data
              </Button>
            </form>
            <Link href="/dashboard">
              <Button className="gap-2">
                Explore Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Platform Capabilities</h2>
            <p className="mt-3 text-slate-600">
              Built for the scale and governance needs of India&apos;s CPSE ecosystem.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Expected Impact</h2>
              <ul className="mt-6 space-y-4">
                {[
                  "One Nation — One Common Material Code",
                  "Reduction in duplicate and redundant material codes",
                  "Improved material master data quality",
                  "Better inventory optimization and visibility",
                  "Reduced procurement cost through demand aggregation",
                  "Improved inter-CPSE material identification and collaboration",
                  "Faster procurement and specification finalization",
                  "Foundation for common procurement and strategic sourcing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white">
              <h3 className="text-xl font-semibold">Architecture at a Glance</h3>
              <div className="mt-6 space-y-4 text-sm text-slate-200">
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <Database className="h-5 w-5" />
                  <span>PostgreSQL + Drizzle ORM persistent layer</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <Brain className="h-5 w-5" />
                  <span>Local NLP matcher (TF-IDF + Levenshtein + spec matching)</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <Globe className="h-5 w-5" />
                  <span>Next.js 16 App Router + Tailwind CSS frontend</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <Cpu className="h-5 w-5" />
                  <span>SAP/ERP-ready REST integration endpoints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
        © 2026 NUMMF — National Unified Material Master Framework. Built for Smart India Hackathon.
      </footer>
    </div>
  );
}
