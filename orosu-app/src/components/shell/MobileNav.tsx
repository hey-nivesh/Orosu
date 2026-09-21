"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Briefcase,
  User,
  Menu,
  X,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { SearchModal } from "./SearchModal";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, profile: authProfile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const displayName = authProfile?.full_name || authUser?.email?.split("@")[0] || "Orosu User";
  const displayEmail = authUser?.email || "";

  const handleSignOut = async () => {
    try {
      setIsDrawerOpen(false);
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      router.push("/login");
    }
  };

  const bottomTabs = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Jobs", href: "/jobs/analyze", icon: Sparkles },
    { label: "Resumes", href: "/resumes", icon: FileText },
    { label: "Applications", href: "/applications", icon: Briefcase },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Top Header (Fixed at top for <lg screens) */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#111111] text-white border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#F97316] flex items-center justify-center p-1">
            <Image
              src="/logo.png"
              alt="Orosu Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">OROSU</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-white/80 hover:text-white rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            href="/settings"
            className="relative p-2 text-white/80 hover:text-white rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications & Settings"
          >
            <Bell className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-white/80 hover:text-white rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-[#111111] text-white h-full shadow-2xl flex flex-col p-6 z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#F97316] flex items-center justify-center p-1">
                  <Image
                    src="/logo.png"
                    alt="Orosu Logo"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-extrabold text-base">OROSU</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-white/60 hover:text-white rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile snippet */}
            <div className="py-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7E22CE] to-[#E11D48] flex items-center justify-center font-bold text-sm text-white">
                {displayName
                  .split(" ")
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("") || "U"}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">{displayName}</div>
                <div className="text-[11px] text-white/60 truncate">{displayEmail}</div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              <Link
                href="/dashboard"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <LayoutDashboard className="w-4 h-4 text-rose-400" />
                <span>Dashboard Overview</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <User className="w-4 h-4 text-purple-400" />
                <span>Master Career Profile</span>
              </Link>
              <Link
                href="/jobs/analyze"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Job Analyzer</span>
              </Link>
              <Link
                href="/resumes"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Resume Workspace</span>
              </Link>
              <Link
                href="/applications"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Target Jobs</span>
              </Link>

              <div className="border-t border-white/10 my-3" />

              <Link
                href="/settings"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <Settings className="w-4 h-4 text-white/60" />
                <span>Settings</span>
              </Link>

              <a
                href="https://orosu.ai/help"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold hover:bg-white/10 min-h-[44px]"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
                <span>Help & Feedback</span>
              </a>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold text-rose-400 hover:bg-white/10 min-h-[44px] text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="grid grid-cols-5 items-center justify-items-center">
          {bottomTabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full min-h-[48px] py-1 rounded-xl transition-all",
                  isActive
                    ? "text-rose-400 font-bold"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 -mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
