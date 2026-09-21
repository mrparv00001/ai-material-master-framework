"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Layers,
  GitCompare,
  Link2,
  CheckCircle,
  ScrollText,
  Upload,
  Cpu,
  Shield,
  Settings,
} from "lucide-react";
import { UserSwitcher } from "./user-switcher";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Materials", href: "/dashboard/materials", icon: Package },
  { label: "Standard Master", href: "/dashboard/standards", icon: Layers },
  { label: "AI Matching", href: "/dashboard/matching", icon: GitCompare },
  { label: "Mappings", href: "/dashboard/mappings", icon: Link2 },
  { label: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
  { label: "Upload / Import", href: "/dashboard/upload", icon: Upload },
  { label: "ERP Integration", href: "/dashboard/erp", icon: Cpu },
  { label: "Audit Trail", href: "/dashboard/audit", icon: ScrollText },
  { label: "Governance", href: "/dashboard/governance", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
          N
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight text-slate-900">NUMMF</h1>
          <p className="text-[10px] text-slate-500">National Unified Material Master</p>
        </div>
      </div>

      <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 py-2">
        <UserSwitcher />
      </div>
    </aside>
  );
}
