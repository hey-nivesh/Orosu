"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function RootPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (profile?.onboarding_completed) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [user, profile, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
      <div className="flex items-center gap-3 text-xs font-bold text-[#666666]">
        <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <span>Loading Orosu Workspace...</span>
      </div>
    </div>
  );
}
