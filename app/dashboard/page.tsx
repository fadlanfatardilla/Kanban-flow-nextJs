"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  LogOut,
  FolderPlus,
  ArrowRight,
  Loader2,
  UserPlus,
  Link as LinkIcon,
  KeyRound,
  ShieldCheck,
  X,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { joinWorkspaceViaLink } from "@/app/actions/workspace-invite";

interface Board {
  id: string;
  title: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  boards: Board[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showModal, setShowModal] = useState(false);

  // State untuk Modal Gabung Workspace via Link & PIN
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [joinPin, setJoinPin] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // State untuk Modal Konfirmasi Hapus Workspace
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status, router]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`/api/workspaces?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error("Gagal memuat workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      if (res.ok) {
        const createdWorkspace = await res.json();
        setWorkspaces((prev) => [createdWorkspace, ...prev]);
        setNewWorkspaceName("");
        setShowModal(false);
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal membuat workspace");
      }
    } catch (error) {
      console.error("Gagal membuat workspace:", error);
    } finally {
      setCreating(false);
    }
  };

  const openDeleteModal = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceToDelete({ id, name });
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceToDelete.id}`, {
        method: "DELETE",
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (res.ok) {
        setWorkspaces((prev) =>
          prev.filter((ws) => ws.id !== workspaceToDelete.id)
        );
        setWorkspaceToDelete(null);
      } else {
        alert(
          data.message ||
            `Gagal menghapus workspace (Status: ${res.status}).`
        );
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Terjadi kesalahan koneksi saat menghapus workspace.");
    } finally {
      setDeleting(false);
    }
  };

  const extractToken = (input: string) => {
    try {
      if (input.includes("/join/")) {
        const parts = input.split("/join/");
        return parts[1].trim();
      }
      return input.trim();
    } catch {
      return input.trim();
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setJoining(true);
    setJoinError(null);

    const token = extractToken(inviteInput);
    const userId = (session?.user as any)?.id || session?.user?.email || "";

    const res = await joinWorkspaceViaLink({
      token,
      userId,
      inputPin: joinPin,
    });

    setJoining(false);

    if (res.success && res.workspaceId) {
      router.push(`/workspace/${res.workspaceId}`);
    } else {
      setJoinError(
        res.error ||
          "Gagal bergabung ke workspace. Periksa kembali tautan dan PIN Anda."
      );
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

      {/* Header Navbar Modern */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl shadow-slate-950/40">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 shadow-lg shadow-orange-500/25 border border-white/10">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
            Kanban Flow
            <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-2xl shadow-inner">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-indigo-600 font-bold text-white text-xs shadow-md">
              {(session?.user?.name || session?.user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 leading-none">
                Aktif Sebagai
              </span>
              <span className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-[150px]">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
          </div>

          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl px-3.5 h-10 text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-red-500/20 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-8 flex-1 w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Layers className="h-6 w-6 text-orange-500" />
              Workspace Anda
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pilih atau buat workspace untuk mengelola proyek kolaborasi tim
              secara profesional.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl px-4 h-11 text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-slate-950/30 transition-all hover:border-slate-700 active:scale-95"
            >
              <UserPlus className="h-4 w-4 text-indigo-400" /> Gabung Workspace
            </Button>

            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white font-bold rounded-2xl px-5 h-11 shadow-lg shadow-orange-500/25 cursor-pointer gap-2 text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="h-4 w-4" /> Buat Workspace
            </Button>
          </div>
        </div>

        {/* Workspace List */}
        {workspaces.length === 0 ? (
          <Card className="border-slate-800/80 bg-slate-900/40 p-16 text-center rounded-3xl backdrop-blur-2xl shadow-2xl border border-dashed">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800/60 border border-slate-700/50 mb-4 shadow-inner">
              <FolderPlus className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Belum Ada Workspace
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto">
              Mulai perjalanan Anda dengan membuat workspace baru atau bergabung
              dengan tim menggunakan tautan undangan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setShowJoinModal(true)}
                variant="outline"
                className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-2xl cursor-pointer text-xs font-bold px-5 h-10"
              >
                Gabung via Link
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl cursor-pointer text-xs font-bold px-5 h-10 shadow-lg shadow-orange-500/20"
              >
                Buat Sekarang
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="group relative rounded-3xl p-[1px] transition-all duration-500 cursor-pointer bg-gradient-to-b from-slate-800/80 via-slate-800/40 to-slate-800/80 hover:from-orange-500/60 hover:via-indigo-500/50 hover:to-orange-500/60 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]"
              >
                <Card className="h-full w-full rounded-[23px] border-0 bg-slate-900/80 hover:bg-slate-900/90 backdrop-blur-xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xl">
                  <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br from-orange-500/10 to-indigo-500/0 blur-2xl group-hover:from-orange-500/25 group-hover:to-indigo-500/20 group-hover:scale-150 transition-all duration-500 pointer-events-none" />

                  <div>
                    <CardHeader className="p-0 mb-4 space-y-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                          Workspace
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Tombol Hapus Workspace */}
                          <button
                            onClick={(e) => openDeleteModal(ws.id, ws.name, e)}
                            className="h-8 w-8 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Workspace"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <div className="h-8 w-8 rounded-xl bg-slate-800/80 group-hover:bg-orange-500/20 flex items-center justify-center text-slate-400 group-hover:text-orange-400 transition-colors">
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>

                      <CardTitle className="text-xl font-black tracking-tight text-slate-100 group-hover:text-white transition-colors">
                        {ws.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
                        {ws.description ||
                          "Klik untuk mengelola proyek, papan kanban, dan kolaborasi tim secara real-time."}
                      </p>
                    </CardContent>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                      <span className="font-semibold text-slate-300">
                        {ws.boards?.length || 0} Papan Kanban
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 group-hover:text-orange-400 font-bold transition-colors">
                      Buka &rarr;
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Popup Konfirmasi Hapus Workspace (Modern & Profesional) */}
      {workspaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-rose-500/30 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-5 relative border">
            <button
              onClick={() => setWorkspaceToDelete(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-white">
                  Hapus Workspace?
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus{" "}
                  <span className="font-bold text-slate-200">
                    "{workspaceToDelete.name}"
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan dan seluruh papan serta kartu tugas di dalamnya akan terhapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setWorkspaceToDelete(null)}
                className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer text-xs font-semibold h-10"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteWorkspace}
                disabled={deleting}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl h-10 px-5 text-xs shadow-lg shadow-rose-500/25 cursor-pointer transition-all"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghapus...
                  </span>
                ) : (
                  "Ya, Hapus Workspace"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Popup Buat Workspace */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-6 relative border">
            <h2 className="text-xl font-extrabold tracking-tight">
              Buat Workspace Baru
            </h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nama Workspace <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Tim Pengembangan Produk"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
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
                  {creating ? "Menyimpan..." : "Buat"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Popup Gabung Workspace via Link & PIN */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-7 space-y-5 relative border">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  Gabung ke Workspace
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Masukkan tautan undangan dan PIN rahasia dari tim Anda.
                </p>
              </div>
            </div>

            {joinError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-rose-400 text-xs">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-indigo-400" /> Tautan
                  Undangan / Token
                </label>
                <Input
                  type="text"
                  placeholder="https://app.com/join/xxxxxx atau token"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  required
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-2xl h-11 px-3.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-400" /> Kode PIN
                  Rahasia
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan PIN dari owner"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-2xl h-11 px-3.5 text-xs tracking-widest font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowJoinModal(false)}
                  className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={joining || !inviteInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl h-10 px-5 text-xs shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  {joining ? "Memproses..." : "Gabung Sekarang"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}