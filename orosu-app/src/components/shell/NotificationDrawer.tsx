"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Check, Sparkles, FileText, UserCheck, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "resume_ready" | "job_analyzed" | "profile_updated";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkUrl?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  if (!isOpen) return null;

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "resume_ready":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case "job_analyzed":
        return <Sparkles className="w-4 h-4 text-rose-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-[#111111]/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(17,17,17,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#111111]" />
            <h3 className="font-bold text-sm text-[#111111]">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllNotifications}
              className="text-[11px] font-bold text-[#E11D48] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#F8F8F6] rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                notif.read
                  ? "bg-[#F8F8F6]/60 border-[rgba(17,17,17,0.04)] text-[#666666]"
                  : "bg-white border-[rgba(17,17,17,0.1)] shadow-sm text-[#111111]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F1F1ED] shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold truncate text-[#111111]">{notif.title}</h4>
                    {!notif.read && (
                      <button
                        onClick={() => markNotificationRead(notif.id)}
                        className="text-[#AAAAAA] hover:text-emerald-600"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(17,17,17,0.04)]">
                    <span className="text-[10px] text-[#999999]">{notif.timestamp}</span>
                    {notif.linkUrl && (
                      <Link
                        href={notif.linkUrl}
                        onClick={onClose}
                        className="text-[10px] font-bold text-[#E11D48] hover:underline"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-12 text-[#888888] text-xs">No new notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}
