"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
}

export function AppShell({ children, title, eyebrow }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] flex flex-col">
      {/* Mobile Top and Bottom Navigation */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-[260px] flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">
        {/* Top Header */}
        <TopHeader title={title} eyebrow={eyebrow} />

        {/* Page Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
