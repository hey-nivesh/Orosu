import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getStatusColor(status: string) {
  switch (status) {
    case "Offer":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Interview":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "Applied":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Ready":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Draft":
      return "bg-neutral-500/10 text-neutral-600 border-neutral-500/20";
    case "Rejected":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "Withdrawn":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-600 border-neutral-500/20";
  }
}

export function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-rose-500";
  if (score >= 70) return "text-amber-500";
  return "text-neutral-500";
}
