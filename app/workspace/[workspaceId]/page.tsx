"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManageMembersModal } from "@/components/ManageMembersModal";
import { WorkspaceActivitiesDropdown } from "@/components/WorkspaceActivitiesDropdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  Plus,
  ArrowLeft,
  Kanban,
  Loader2,
  Users,
  LogOut,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";

interface Column {
  id: string;
  title: string;
}

interface Board {
  id: string;
  title: string;
  columns: Column[];
}

function WorkspaceDetailContent() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [boards, setBoards] = useState<Board[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  // State untuk Toast Notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && workspaceId) {
      fetchWorkspaceData();
    }
  }, [status, workspaceId, router]);

  const fetchWorkspaceData = async () => {
    try {
      const wsRes = await fetch(`/api/workspaces/${workspaceId}`);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspace(wsData);
      } else {
        const errorData = await wsRes.json().catch(() => ({}));
        console.error(
          `Gagal mengambil data workspace (${wsRes.status}):`,
          errorData,
        );
      }

      const boardsRes = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData);
      }
    } catch (error) {
      console.error("Gagal memuat data workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManageModal = () => {
    fetchWorkspaceData();
    setIsManageOpen(true);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBoardTitle }),
      });

      if (res.ok) {
        setNewBoardTitle("");
        setShowModal(false);
        fetchWorkspaceData();
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal membuat papan kanban");
      }
    } catch (error) {
      console.error("Gagal membuat board:", error);
      alert("Terjadi kesalahan jaringan atau server");
    } finally {
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-9 w-9 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-orange-500/30">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Toast Notification Floating */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-slate-100 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`h-2.5 w-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"}`}
          />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Modern Glassmorphism Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl shadow-slate-950/40">
        <div className="flex items-center gap-5">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-2xl transition-all cursor-pointer h-10 w-10 border border-transparent hover:border-slate-700/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 shadow-lg shadow-orange-500/25 border border-white/10">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                {workspace?.name || "Detail Workspace"}
                <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Kelola Tim & Papan Kerja
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WorkspaceActivitiesDropdown
            workspaceId={workspace?.id || workspaceId}
          />

          <Button
            onClick={handleOpenManageModal}
            variant="outline"
            className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl px-4 h-10 text-xs flex items-center gap-2.5 cursor-pointer shadow-md shadow-slate-950/30 transition-all hover:border-slate-700 active:scale-95"
          >
            <Users className="h-4 w-4 text-indigo-400" />
            <span>Kelola Anggota</span>
            <span className="ml-0.5 px-2 py-0.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-extrabold">
              {workspace?.members?.length || 0}
            </span>
          </Button>

          {/* Tombol Logout Baru */}
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl px-3.5 h-10 text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-red-500/20 flex items-center gap-2"
            title="Keluar Akun"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-8 flex-1 w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Layers className="h-6 w-6 text-orange-500" />
              Papan Kanban Proyek
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pilih papan kerja di bawah ini untuk mulai mengelola tahapan tugas dan berkolaborasi secara real-time.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white font-bold rounded-2xl px-5 h-11 shadow-lg shadow-orange-500/25 cursor-pointer gap-2 text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" /> Buat Papan Baru
          </Button>
        </div>

        {/* Board List Section */}
        {boards.length === 0 ? (
          <Card className="border-slate-800/80 bg-slate-900/40 p-16 text-center rounded-3xl backdrop-blur-2xl shadow-2xl border border-dashed">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800/60 border border-slate-700/50 mb-4 shadow-inner">
              <Kanban className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Belum Ada Papan Kanban</h3>
            <p className="text-sm text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto">
              Buat papan pertama Anda untuk mulai mengatur tahapan kerja tim secara sistematis.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl px-6 h-10 text-xs shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
            >
              Buat Papan Sekarang
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Card
                key={board.id}
                onClick={() => router.push(`/board/${board.id}`)}
                className="group border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-300 cursor-pointer rounded-3xl p-6 relative overflow-hidden shadow-xl backdrop-blur-2xl flex flex-col justify-between hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500 pointer-events-none" />

                <div>
                  <CardHeader className="p-0 mb-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-orange-400 group-hover:scale-110 transition-transform duration-300">
                        <Kanban className="h-5 w-5" />
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 group-hover:border-orange-500/30 transition-colors">
                        {board.columns?.length || 0} Kolom
                      </span>
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-white group-hover:text-orange-400 transition-colors pt-2">
                      {board.title}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs leading-relaxed">
                      Papan manajemen tugas kolaboratif untuk memantau progress proyek.
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="p-0 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  <span className="flex items-center gap-1.5 text-orange-400">
                    Buka Papan Kerja
                  </span>
                  <div className="h-7 w-7 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 text-slate-400 group-hover:text-white transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal Popup Buat Board */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border">
            <h2 className="text-xl font-extrabold tracking-tight">Buat Papan Kanban Baru</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Judul Papan <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Sprint Minggu Ini / Fitur Landing Page"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-orange-500 rounded-2xl h-11 px-4 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 font-bold shadow-lg shadow-orange-500/25 cursor-pointer text-xs h-10 transition-all"
                >
                  {creating ? "Menyimpan..." : "Buat Papan"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Kelola Anggota & Peran */}
      <ManageMembersModal
        workspace={workspace}
        isManageOpen={isManageOpen}
        setIsManageOpen={setIsManageOpen}
        showToast={showToast}
      />
    </div>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <Loader2 className="h-9 w-9 animate-spin text-orange-500" />
        </div>
      }
    >
      <WorkspaceDetailContent />
    </Suspense>
  );
}