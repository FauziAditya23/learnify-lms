"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type FormState = "idle" | "loading" | "success" | "error";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Masukkan alamat email yang valid.");
      return;
    }

    setState("loading");
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      });

      if (error) {
        // Jangan bocorkan apakah email terdaftar atau tidak (security best practice)
        // Tampilkan pesan sukses meskipun email tidak ditemukan
        console.log("Forget password error:", error);
      }

      // Selalu tampilkan sukses — cegah user menebak email mana yang terdaftar
      setState("success");
    } catch {
      setState("error");
      setErrorMsg("Terjadi kesalahan server. Silakan coba lagi.");
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans overflow-hidden selection:bg-primary/20">
      
      {/* Tombol Close */}
      <Link
        href="/auth/login"
        className="absolute top-6 right-6 p-2.5 hover:bg-slate-100 rounded-full transition-all duration-300 z-20 group"
      >
        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
      </Link>

      {/* --- LEFT SIDE: Spatial Glass Environment --- */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-white border-r border-slate-100">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-400/20 mix-blend-multiply filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/15 mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <Link href="/" className="inline-flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 duration-300">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Learnify<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="mb-10 max-w-lg bg-white/40 backdrop-blur-3xl border border-white/60 p-8 rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight mb-6 text-slate-900 leading-tight">
              Lupa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Password?
              </span>
            </h2>
            <p className="text-slate-600 font-medium">
              Tenang, kami akan kirimkan link reset ke email kamu dalam hitungan detik.
            </p>
          </div>
          <div />
        </div>
      </div>

      {/* ── Right Side ────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 p-8 lg:p-24 bg-white flex flex-col justify-center overflow-y-auto relative z-10">

          {/* Back to Login */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors mb-8 group w-fit"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Login
          </Link>

          {state !== "success" ? (
            <>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Masukkan email yang terdaftar. Kami akan kirimkan link untuk membuat password baru.
                </p>
              </div>

              {/* Error Message */}
              {(state === "error" || errorMsg) && (
                <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg || "Terjadi kesalahan. Silakan coba lagi."}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="group">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block group-focus-within:text-primary">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                      required
                      disabled={state === "loading"}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirim Email...</span>
                    </>
                  ) : (
                    "Kirim Link Reset Password"
                  )}
                </button>
              </form>

              <p className="text-center text-xs font-medium text-slate-400 mt-8">
                Ingat password kamu?{" "}
                <Link href="/auth/login" className="text-primary font-bold hover:underline">
                  Masuk Sekarang
                </Link>
              </p>
            </>
          ) : (
            /* ── Success State ──────────────────────────────────────────────── */
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Email Terkirim! 📬</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[300px] mb-2">
                Kami sudah mengirim link reset password ke:
              </p>
              <p className="text-primary font-bold text-sm mb-6">{email}</p>

              <div className="bg-slate-50 rounded-2xl p-5 text-left w-full max-w-[340px] mb-8 space-y-2">
                <p className="text-xs font-bold text-slate-700 mb-3">Langkah selanjutnya:</p>
                {[
                  "Buka aplikasi email kamu",
                  "Cari email dari Learnify LMS",
                  "Klik tombol \"Reset Password Sekarang\"",
                  "Link aktif selama 1 jam",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-600">{step}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Tidak menerima email? Cek folder Spam atau junk mail.
              </p>

              <button
                onClick={() => { setState("idle"); setEmail(""); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Kirim ulang ke email lain
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default ForgotPasswordPage;
