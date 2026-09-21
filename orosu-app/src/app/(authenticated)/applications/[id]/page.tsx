"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles } from "lucide-react";
import { useCareer } from "@/lib/store/career-store";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { jobs } = useCareer();

  useEffect(() => {
    if (id) {
      router.replace(`/jobs/${id}`);
    }
  }, [id, router]);

  return (
    <div className="p-12 text-center bg-white rounded-3xl border border-[rgba(17,17,17,0.08)] space-y-4">
      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
        <Sparkles className="w-5 h-5" />
      </div>
      <h3 className="text-base font-extrabold text-[#111111]">Redirecting to Job Opportunity...</h3>
      <Link href="/jobs" className="text-xs text-rose-600 font-bold inline-block hover:underline">
        Go to Job Opportunities
      </Link>
    </div>
  );
}
