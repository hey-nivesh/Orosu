"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { SearchModal } from "./SearchModal";
import { NotificationDrawer } from "./NotificationDrawer";

interface TopHeaderProps {
  title?: string;
  eyebrow?: string;
}

export function TopHeader({ title, eyebrow }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, profile: authProfile, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayName = authProfile?.full_name || authUser?.email?.split("@")[0] || "Orosu User";
  const displayEmail = authUser?.email || "";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      router.push("/login");
    }
  };

  // Derive dynamic page title if not explicitly provided
  const getPageTitle = () => {
    if (title) return title;
    if (pathname === "/dashboard") return "Overview";
    if (pathname === "/profile") return "Career Profile";
    if (pathname.startsWith("/jobs/analyze")) return "Job Analyzer";
    if (pathname.startsWith("/jobs")) return "Job Opportunities";
    if (pathname.startsWith("/resumes")) return "Resume Workspace";
    if (pathname.startsWith("/applications")) return "Applications Tracker";
    if (pathname.startsWith("/settings")) return "Settings & Privacy";
    return "Workspace";
  };

  const getEyebrow = () => {
    if (eyebrow) return eyebrow;
    if (pathname === "/dashboard") return "CAREER COMMAND CENTER";
    if (pathname === "/profile") return "CANONICAL SOURCE OF TRUTH";
    if (pathname.startsWith("/jobs")) return "AI ROLE ALIGNMENT";
    if (pathname.startsWith("/resumes")) return "TAILORED EVIDENCE SYSTEM";
    if (pathname.startsWith("/applications")) return "PIPELINE TRACKER";
    return "OROSU WORKSPACE";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 py-4 bg-[#F8F8F6]/85 backdrop-blur-md border-b border-[rgba(17,17,17,0.06)]">
        {/* Left Title & Eyebrow */}
        <div>
          <div className="eyebrow text-[10px] text-[#666666] mb-1">
            <span className="eyebrow-dot" />
            <span>{getEyebrow()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-[rgba(17,17,17,0.08)] shadow-sm hover:border-[rgba(17,17,17,0.18)] transition-all text-[#666666] hover:text-[#111111] text-xs font-semibold"
          >
            <Search className="w-4 h-4 text-[#888888]" />
            <span className="hidden md:inline">Quick search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-[#888888] bg-[#F1F1ED] rounded border border-[rgba(17,17,17,0.08)]">
              ⌘K
            </kbd>
          </button>

          {/* New Job CTA */}
          <Link
            href="/jobs/analyze"
            className="hidden sm:inline-flex items-center gap-2 gradient-cta px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-soft"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Job</span>
          </Link>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2.5 rounded-2xl bg-white border border-[rgba(17,17,17,0.08)] text-[#666666] hover:text-[#111111] hover:border-[rgba(17,17,17,0.18)] transition-all shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-white border border-[rgba(17,17,17,0.08)] hover:border-[rgba(17,17,17,0.18)] transition-all shadow-sm"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7E22CE] to-[#E11D48] flex items-center justify-center font-extrabold text-xs text-white">
                {displayName
                  .split(" ")
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("") || "U"}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-[#111111] max-w-[100px] truncate">
                {displayName.split(" ")[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[rgba(17,17,17,0.08)] shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[rgba(17,17,17,0.06)]">
                    <div className="text-xs font-bold text-[#111111]">{displayName}</div>
                    <div className="text-[10px] text-[#666666] truncate">{displayEmail}</div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#888888]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#888888]" />
                    <span>Settings</span>
                  </Link>

                  <a
                    href="https://orosu.ai/help"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-[#888888]" />
                    <span>Help & Documentation</span>
                  </a>

                  <div className="border-t border-[rgba(17,17,17,0.06)] my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
