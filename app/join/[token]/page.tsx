"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { joinWorkspaceViaLink } from "@/app/actions/workspace-invite";

export default function JoinWorkspacePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Asumsikan userId didapatkan dari session / auth state Anda
    // Gantilah 'CURRENT_USER_ID' dengan ID user yang sedang login
    const currentUserId = "CURRENT_USER_ID"; 

    const res = await joinWorkspaceViaLink({
      token,
      userId: currentUserId,
      inputPin: pin,
    });

    setLoading(false);

    if (res.success) {
      // Redirect langsung ke halaman workspace / board
      router.push(`/board/${res.workspaceId}`);
    } else {
      setErrorMessage(res.error || "Gagal bergabung ke workspace.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-2xl p-6 space-y-6 border relative">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Bergabung ke Workspace</h1>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan Kode PIN Rahasia yang diberikan oleh Owner untuk mengakses workspace ini.
            </p>
          </div>
        </div>

        {/* Notifikasi Error jika PIN salah / expired */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form Input PIN */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" /> Kode PIN Rahasia
            </label>
            <Input
              type="text"
              placeholder="Masukkan PIN 6 Digit"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="bg-slate-950/80 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-2xl h-12 px-4 text-center text-base tracking-widest font-mono"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl h-12 text-sm shadow-lg shadow-indigo-600/25 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi PIN...</span>
              </>
            ) : (
              <>
                <span>Bergabung Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}