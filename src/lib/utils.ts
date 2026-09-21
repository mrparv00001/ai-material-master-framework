import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateNationalMaterialCode(category: string, index: number): string {
  const prefix = category
    .split(/[^a-zA-Z]+/)
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 3)
    .padEnd(3, "X");
  const seq = String(index).padStart(7, "0");
  return `NMM-${prefix}-${seq}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return Number(n).toLocaleString("en-IN");
}

export function truncate(str: string, length = 60): string {
  if (!str) return "";
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}
