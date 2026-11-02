import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Kanban,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Layers,
  LayoutDashboard,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-orange-500/30 font-sans">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-orange-500/15 via-rose-500/10 to-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-2xl px-6 lg:px-16 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 shadow-lg shadow-orange-500/25">
            <Kanban className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
            KanbanFlow
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              SaaS
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-2xl font-semibold cursor-pointer px-5"
            >
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold rounded-2xl px-5 h-10 shadow-lg shadow-orange-500/20 cursor-pointer transition-all">
              Daftar Gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 relative z-10 max-w-6xl mx-auto space-y-12">
        {/* Badge Intro */}
        <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 backdrop-blur-xl shadow-inner">
          <Sparkles className="h-4 w-4 text-orange-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-slate-300">
            Platform Manajemen Proyek Modern Berbasis Next.js 16
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-6 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Kelola Proyek Lebih Cepat dengan{" "}
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Papan Kanban Interaktif
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Organisasikan tugas, atur prioritas kerja, dan optimalkan alur
            kolaborasi tim Anda dengan pengalaman *Drag and Drop* yang mulus dan
            responsif secara *real-time*.
          </p>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-black text-base rounded-2xl px-8 h-13 shadow-xl shadow-orange-500/25 cursor-pointer gap-2 transition-all">
              Mulai Sekarang Gratis <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-base rounded-2xl px-8 h-13 backdrop-blur-xl cursor-pointer transition-all"
            >
              Masuk Akun
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full pt-12">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl hover:border-slate-700/80 transition-all space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Drag & Drop Cepat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pindahkan tugas antar kolom secara intuitif dengan pembaruan
              urutan otomatis di database.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl hover:border-slate-700/80 transition-all space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Kolom & Prioritas Kustom
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buat kolom tahapan fleksibel sesuai kebutuhan serta tetapkan
              prioritas URGENT hingga LOW.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl hover:border-slate-700/80 transition-all space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Autentikasi Aman</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dilindungi oleh NextAuth.js dan Neon Database Serverless untuk
              keamanan data yang optimal.
            </p>
          </div>
        </div>

        {/* App Showcase / Mockup Illustration */}
        <div className="w-full pt-8">
          <div className="relative rounded-3xl p-2 bg-gradient-to-b from-slate-800/80 to-slate-900/40 border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden">
            <div className="bg-slate-950 rounded-2xl p-6 md:p-8 space-y-6">
              {/* Header Mockup */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="flex h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="flex h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  kanbanflow-workspace.vercel.app
                </span>
              </div>

              {/* Board Columns Illustration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">
                      To Do
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                      2
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                    <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      URGENT
                    </span>
                    <p className="text-xs font-semibold text-slate-200">
                      Desain Tampilan UI Landing Page
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                      LOW
                    </span>
                    <p className="text-xs font-semibold text-slate-200">
                      Riset Pustaka Animasi CSS
                    </p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">
                      In Progress
                    </span>
                    <span className="text-[10px] bg-orange-500/20 px-2 py-0.5 rounded-full text-orange-400">
                      1
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-orange-500/30 rounded-xl p-3 space-y-2 shadow-md">
                    <span className="text-[10px] font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      HIGH
                    </span>
                    <p className="text-xs font-semibold text-slate-100">
                      Integrasi API Drag and Drop
                    </p>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">
                      Done
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">
                      1
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 shadow-sm opacity-80">
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      MEDIUM
                    </span>
                    <p className="text-xs font-semibold text-slate-200 line-through">
                      Setup Prisma ORM & Neon DB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>
          © 2026 KanbanFlow. Dibuat dengan Next.js App Router, Prisma, &
          Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}
