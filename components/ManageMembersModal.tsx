"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Users, Loader2, Trash2 } from "lucide-react";

export function ManageMembersModal({
  workspace,
  isManageOpen,
  setIsManageOpen,
  showToast,
}: any) {
  const { data: session } = useSession();
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Cek apakah user yang sedang login saat ini adalah OWNER di workspace ini
  const currentUserMember = workspace?.members?.find(
    (m: any) => m.user?.email === session?.user?.email,
  );
  const isOwner = currentUserMember?.role === "OWNER";

  // Sinkronisasi state role saat data workspace/members berubah
  useEffect(() => {
    if (workspace?.members) {
      const initialRoles: { [key: string]: string } = {};
      workspace.members.forEach((m: any) => {
        initialRoles[m.id] = m.role;
      });
      setSelectedRoles(initialRoles);
    }
  }, [workspace]);

  if (!isManageOpen) return null;

  // Handler Hapus / Keluarkan Member (Khusus Owner)
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengeluarkan ${memberName} dari workspace ini?`,
      )
    ) {
      return;
    }

    setDeletingMemberId(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        showToast(
          `Berhasil mengeluarkan ${memberName} dari workspace.`,
          "success",
        );
        setIsManageOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        showToast(data.message || "Gagal mengeluarkan anggota.", "error");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setDeletingMemberId(null);
    }
  };

  // Handler untuk menyimpan semua perubahan role sekaligus
  const handleSaveAllChanges = async () => {
    setIsSubmitting(true);
    try {
      // Filter hanya member yang rolenya berubah dari awal
      const changes = workspace.members
        .filter(
          (m: any) => selectedRoles[m.id] && selectedRoles[m.id] !== m.role,
        )
        .map((m: any) => ({
          memberId: m.id,
          role: selectedRoles[m.id],
        }));

      if (changes.length === 0) {
        showToast("Tidak ada perubahan peran yang dilakukan.", "error");
        setIsSubmitting(false);
        return;
      }

      // Kirim request update untuk setiap perubahan role
      await Promise.all(
        changes.map((change) =>
          fetch(`/api/workspaces/${workspace.id}/members/${change.memberId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: change.role }),
          }),
        ),
      );

      // Munculkan alert / toast sukses
      showToast("Berhasil memperbarui peran anggota!", "success");

      // Tutup modal secara otomatis
      setIsManageOpen(false);

      // Refresh halaman untuk memperbarui data terbaru
      window.location.reload();
    } catch (error) {
      console.error("Error updating roles:", error);
      showToast("Terjadi kesalahan koneksi saat menyimpan peran.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-6 space-y-5 relative border">
        <button
          onClick={() => setIsManageOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-extrabold tracking-tight">
            Kelola Anggota & Peran
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Anggota Workspace
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {workspace?.members?.length || 0} Anggota
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            {!workspace?.members || workspace.members.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Belum ada anggota di workspace ini.
              </p>
            ) : (
              workspace.members.map((member: any) => {
                const currentSelectedRole =
                  selectedRoles[member.id] || member.role;
                const hasChanged = currentSelectedRole !== member.role;
                const isSelf = member.user?.email === session?.user?.email;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between bg-slate-950/60 border rounded-2xl p-3 text-xs gap-3 transition-all ${
                      hasChanged
                        ? "border-orange-500/50 bg-orange-500/5"
                        : "border-slate-800/80"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                        {member.user?.name || "Pengguna Tanpa Nama"}
                        {isSelf && (
                          <span className="text-[9px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded-md font-normal">
                            Anda
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {member.user?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Dropdown Pilihan Role */}
                      <select
                        value={currentSelectedRole}
                        disabled={!isOwner}
                        onChange={(e) =>
                          setSelectedRoles({
                            ...selectedRoles,
                            [member.id]: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-semibold rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option
                          value="OWNER"
                          className="bg-slate-900 text-orange-400 font-bold"
                        >
                          OWNER
                        </option>
                        <option
                          value="MEMBER"
                          className="bg-slate-900 text-slate-300"
                        >
                          MEMBER
                        </option>
                      </select>

                      {/* Tombol Hapus Anggota (Hanya muncul untuk Owner dan tidak bisa menghapus diri sendiri) */}
                      {isOwner && !isSelf && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingMemberId === member.id}
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.user?.name || "Anggota",
                            )
                          }
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer transition-colors"
                          title="Keluarkan dari workspace"
                        >
                          {deletingMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            {isOwner ? (
              "Sebagai Owner, Anda berhak mengubah peran dan mengeluarkan anggota."
            ) : (
              <>
                Ubah peran menjadi{" "}
                <span className="text-orange-400 font-bold">OWNER</span> untuk
                memberikan akses penuh atas due date & assignee.
              </>
            )}
          </p>

          {/* Tombol Simpan / OK Utama di Bawah */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsManageOpen(false)}
              className="text-slate-400 hover:text-slate-200 rounded-xl px-4 text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            {isOwner && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAllChanges}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6 h-9 text-xs cursor-pointer shadow-lg shadow-orange-500/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {isSubmitting ? "Menyimpan..." : "OK"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
