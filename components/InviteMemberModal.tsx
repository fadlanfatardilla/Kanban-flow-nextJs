import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  X,
  UserPlus,
  Copy,
  RefreshCw,
  KeyRound,
  Clock,
  Check,
  ShieldCheck,
} from "lucide-react";
import { updateWorkspaceInviteSettings } from "@/app/actions/workspace-invite";

export function InviteMemberModal({
  workspace,
  setWorkspace, // Prop opsional jika ingin memperbarui state workspace di parent
  isInviteOpen,
  setIsInviteOpen,
  inviteEmail,
  setInviteEmail,
  handleInviteMember,
  inviting,
  showToast,
}: any) {
  const [activeTab, setActiveTab] = useState<"email" | "link">("email");
  const [copied, setCopied] = useState(false);
  const [pin, setPin] = useState(workspace?.invitePin || "");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Sync PIN state saat prop workspace berubah
  useEffect(() => {
    if (workspace?.invitePin) {
      setPin(workspace.invitePin);
    }
  }, [workspace]);

  if (!isInviteOpen) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  // Pastikan token valid (jika belum ada di workspace state, cegah output 'undefined')
  const currentToken = workspace?.inviteToken || "";
  const inviteUrl = currentToken ? `${baseUrl}/join/${currentToken}` : "";

  const handleCopyLink = () => {
    if (!inviteUrl || !currentToken) {
      showToast("Silakan klik 'Simpan & Aktifkan PIN' terlebih dahulu untuk membuat tautan!", "error");
      return;
    }
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast("Tautan undangan berhasil disalin ke clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
  try {
    const res = await fetch(`/api/workspaces/${workspace.id}/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      showToast("Berhasil memperbarui peran anggota!", "success");
      setWorkspace(); 
    } else {
      const data = await res.json();
      showToast(data.message || "Gagal mengubah peran", "error");
    }
  } catch (error) {
    console.error("Error changing role:", error);
    showToast("Terjadi kesalahan koneksi", "error");
  }
};

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(randomPin);
    showToast("PIN baru berhasil di-generate! Jangan lupa klik Simpan.", "success");
  };

  const handleSavePinSettings = async () => {
    if (!workspace?.id) {
      showToast("Data workspace tidak valid.", "error");
      return;
    }

    setSavingSettings(true);
    const res = await updateWorkspaceInviteSettings({
      workspaceId: workspace.id,
      pin: pin.trim(),
      expiresInDays,
      isLinkActive: true,
    });
    setSavingSettings(false);

    if (res.success && res.data) {
      // Jika parent mengirimkan setWorkspace, perbarui agar token baru langsung tersimpan di React State
      if (typeof setWorkspace === "function") {
        setWorkspace((prev: any) => ({
          ...prev,
          ...res.data,
        }));
      }

      showToast("PIN dan masa berlaku berhasil disimpan & diaktifkan!", "success");
      setIsInviteOpen(false);
    } else {
      showToast(res.error || "Gagal menyimpan pengaturan.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-6 space-y-5 relative border">
        <button
          onClick={() => setIsInviteOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <UserPlus className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-extrabold tracking-tight">
            Undang Anggota ke Workspace
          </h2>
        </div>

        {/* Tab Navigasi Mode Undangan */}
        <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "email"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Undang via Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "link"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tautan & Kode PIN
          </button>
        </div>

        {/* Tab 1: Email Direct Invite */}
        {activeTab === "email" && (
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email Pengguna
              </label>
              <Input
                type="email"
                placeholder="masukkan.email@pengguna.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-2xl h-11 px-4 text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Pastikan akun tersebut sudah terdaftar di aplikasi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-200 rounded-2xl px-4 cursor-pointer text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={inviting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 h-10 text-xs font-bold shadow-lg shadow-indigo-500/25 cursor-pointer transition-all"
              >
                {inviting ? "Mengundang..." : "Kirim Undangan"}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Invite Link & PIN Keamanan */}
        {activeTab === "link" && (
          <div className="space-y-5">
            {/* Seksi Salin Tautan (Permanen & Stabil) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Tautan Undangan Permanen</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Aman & Stabil
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl || "Klik 'Simpan & Aktifkan PIN' di bawah untuk membuat tautan"}
                  className="bg-slate-950/60 border-slate-800 text-slate-300 rounded-2xl h-10 px-3 text-xs select-all truncate"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-3 h-10 shrink-0 cursor-pointer text-xs gap-1.5"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>

            {/* Seksi Pengaturan PIN Rahasia & Tombol Reset PIN */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-indigo-400" /> Kode PIN Rahasia
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="h-3 w-3" /> Acak PIN Baru
                  </button>
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan atau acak PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-2xl h-10 px-3 text-xs tracking-widest font-mono"
                />
              </div>

              {/* Seksi Masa Berlaku PIN */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-400" /> Masa Berlaku PIN
                </label>
                <select
                  value={expiresInDays === null ? "never" : expiresInDays.toString()}
                  onChange={(e) =>
                    setExpiresInDays(
                      e.target.value === "never" ? null : parseInt(e.target.value)
                    )
                  }
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-2xl h-10 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="1" className="bg-slate-900">1 Hari (24 Jam)</option>
                  <option value="7" className="bg-slate-900">7 Hari</option>
                  <option value="30" className="bg-slate-900">30 Hari</option>
                  <option value="never" className="bg-slate-900">Tanpa Batas Waktu</option>
                </select>
              </div>

              <Button
                type="button"
                onClick={handleSavePinSettings}
                disabled={savingSettings}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl h-10 text-xs cursor-pointer mt-2 shadow-lg shadow-indigo-600/20"
              >
                {savingSettings ? "Menyimpan..." : "Simpan & Aktifkan PIN"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}