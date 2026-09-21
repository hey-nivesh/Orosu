"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  User,
  Sparkles,
  FileText,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, profile: authProfile, signOut } = useAuth();

  const displayName = authProfile?.full_name || authUser?.email?.split("@")[0] || "Orosu User";
  const displayEmail = authUser?.email || "";
  const completeness = authProfile?.profile_completion || 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      router.push("/login");
    }
  };

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Career Profile",
      href: "/profile",
      icon: User,
    },
    {
      label: "Job Analyzer",
      href: "/jobs/analyze",
      icon: Sparkles,
      badge: "AI",
    },
    {
      label: "Resumes",
      href: "/resumes",
      icon: FileText,
    },
    {
      label: "Applications",
      href: "/applications",
      icon: Briefcase,
    },
  ];

  const bottomNavItems = [
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[#111111] text-white fixed top-0 left-0 border-r border-[rgba(255,255,255,0.08)] z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-5 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 flex items-center justify-center p-1.5 shadow-glow">
            <Image
              src="/logo.png"
              alt="Orosu Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-rose-400 transition-colors">
              OROSU
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#888888] uppercase">
              Career Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold tracking-widest text-[#777777] uppercase">
            Workspace
          </span>
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group relative",
                isActive
                  ? "bg-white/10 text-white font-bold"
                  : "text-[#999999] hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#E11D48] to-[#F97316]" />
              )}
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-rose-400"
                      : "text-[#777777] group-hover:text-white"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-5 border-t border-[rgba(255,255,255,0.08)]" />

        {/* Profile Completeness Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#EEEEEE]">
              Master Profile
            </span>
            <span className="text-xs font-extrabold text-rose-400">
              {completeness}%
            </span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-[#7E22CE] via-[#E11D48] to-[#F97316] rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>

          <Link
            href="/profile"
            className="text-[10px] font-bold text-[#AAAAAA] hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Optimize profile strength</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Secondary Links */}
        <div className="pt-3 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-white/10 text-white font-bold"
                    : "text-[#888888] hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4 text-[#777777] group-hover:text-white" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <a
            href="https://orosu.ai/feedback"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-[#777777]" />
              <span>Help & Feedback</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#555555]" />
          </a>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-black/20">
        <div className="flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7E22CE] to-[#E11D48] flex items-center justify-center font-bold text-xs text-white shrink-0">
              {displayName
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("") || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                {displayName}
              </span>
              <span className="text-[10px] text-[#888888] truncate">
                {displayEmail}
              </span>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="p-1.5 text-[#777777] hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
