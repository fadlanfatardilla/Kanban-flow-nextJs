"use client";

import { useState, useEffect } from "react";
import { Bell, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceActivitiesDropdown({ workspaceId }: { workspaceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/activities`);
      if (res.ok) {
        const data = await res.json();
        
        // Hitung jumlah aktivitas baru (misalnya membandingkan dengan penyimpanan lokal terakhir atau total)
        // Sederhananya: kita hitung total aktivitas atau simpan timestamp terakhir yang dibaca
        setActivities(data);
        
        // Contoh sederhana: jika ada aktivitas baru dari user lain
        const lastReadTime = localStorage.getItem(`last_read_activity_${workspaceId}`);
        if (lastReadTime) {
          const unread = data.filter((act: any) => new Date(act.createdAt).getTime() > Number(lastReadTime)).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(data.length);
        }
      }
    } catch (error) {
      console.error("Gagal memuat aktivitas:", error);
    }
  };

  // Polling otomatis setiap 10 detik untuk mendapatkan update real-time tanpa reload
  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Tandai sudah dibaca saat dropdown dibuka
      setUnreadCount(0);
      localStorage.setItem(`last_read_activity_${workspaceId}`, Date.now().toString());
    }
  };

  return (
    <div className="relative">
      {/* Tombol Lonceng dengan Badge Angka Real-time */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpenDropdown}
        className="text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-2xl relative cursor-pointer h-10 w-10 border border-slate-800/80 transition-all"
        title="Riwayat Aktivitas Workspace"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white shadow-md shadow-orange-500/40 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel Aktivitas */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 z-50 backdrop-blur-2xl text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Aktivitas Terbaru</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pt-3 pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada aktivitas tercatat.</p>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      {act.user?.name || "Seseorang"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {act.details || `Melakukan aksi ${act.action}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}