"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type FormState = "idle" | "loading" | "success" | "error" | "invalid-token";

// ── Password strength rules ────────────────────────────────────────────────────
const rules = [
  { label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Huruf kapital (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Huruf kecil (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Angka (0-9)", test: (p: string) => /[0-9]/.test(p) },
];

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cek token saat halaman dibuka
  useEffect(() => {
    if (!token) {
      setState("invalid-token");
    }
  }, [token]);

  const passwordStrength = rules.filter((r) => r.test(password)).length;
  const isPasswordValid = passwordStrength === rules.length;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const strengthLabels = ["Sangat Lemah", "Lemah", "Cukup", "Kuat"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isPasswordValid) {
      setErrorMsg("Password belum memenuhi semua persyaratan keamanan.");
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }
    if (!token) {
      setState("invalid-token");
      return;
    }

    setState("loading");
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        if (error.status === 400 || error.message?.toLowerCase().includes("token")) {
          setState("invalid-token");
        } else {
          setState("error");
          setErrorMsg("Gagal mereset password. Silakan coba lagi.");
        }
        return;
      }

      setState("success");
      // Auto redirect ke login setelah 3 detik
      setTimeout(() => router.push("/auth/login"), 3000);
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
        <X className="w-5 h-5 text-slate-500 font-medium group-hover:text-slate-700" />
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
              Buat Password <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Baru
              </span>
            </h2>
            <p className="text-slate-600 font-medium">
              Pastikan password baru kamu kuat dan belum pernah digunakan sebelumnya.
            </p>
          </div>
          <div />
        </div>
      </div>

      {/* ── Right Side ────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 p-8 lg:p-24 bg-white flex flex-col justify-center overflow-y-auto relative z-10">

          {/* ── Invalid Token State ──────────────────────────────────────────── */}
          {state === "invalid-token" && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Link Tidak Valid</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[300px] mb-8">
                Link reset password ini sudah <strong>kadaluarsa</strong> atau <strong>sudah pernah digunakan</strong>. Link hanya berlaku 1 jam.
              </p>
              <Link
                href="/auth/forgot-password"
                className="w-full max-w-[280px] h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center justify-center text-sm"
              >
                Minta Link Reset Baru
              </Link>
              <Link href="/auth/login" className="text-xs font-medium text-slate-500 font-medium hover:text-slate-600 mt-4">
                Kembali ke Login
              </Link>
            </div>
          )}

          {/* ── Success State ────────────────────────────────────────────────── */}
          {state === "success" && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Password Berhasil Diubah! 🎉</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mb-8">
                Password baru kamu sudah aktif. Kamu akan diarahkan ke halaman login dalam 3 detik...
              </p>
              <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-6" />
              <Link
                href="/auth/login"
                className="text-sm font-bold text-primary hover:underline"
              >
                Masuk Sekarang →
              </Link>
            </div>
          )}

          {/* ── Form State ──────────────────────────────────────────────────── */}
          {(state === "idle" || state === "loading" || state === "error") && (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Buat Password Baru</h3>
                <p className="text-slate-500 text-sm">
                  Password baru harus berbeda dari yang sebelumnya.
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Baru */}
                <div className="group">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block group-focus-within:text-primary">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 font-medium group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 karakter + angka + kapital"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-11 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                      required
                      disabled={state === "loading"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 font-medium hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-100"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold ${passwordStrength === 4 ? "text-green-600" : passwordStrength >= 2 ? "text-yellow-600" : "text-red-500"}`}>
                        {strengthLabels[passwordStrength - 1] || "Terlalu Pendek"}
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                        {rules.map((rule) => (
                          <p key={rule.label} className={`text-[10px] flex items-center gap-1 transition-colors duration-500 ${rule.test(password) ? "text-green-600 line-through opacity-70" : "text-slate-500 font-medium"}`}>
                            <span>{rule.test(password) ? "✓" : "○"}</span> {rule.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div className="group">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block group-focus-within:text-primary">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 font-medium group-focus-within:text-primary" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className={`w-full h-11 bg-slate-50 border rounded-xl pl-11 pr-11 outline-none focus:bg-white focus:ring-2 transition-all text-sm font-medium ${
                        confirmPassword.length > 0
                          ? doPasswordsMatch
                            ? "border-green-300 focus:border-green-400 focus:ring-green-50"
                            : "border-red-300 focus:border-red-400 focus:ring-red-50"
                          : "border-slate-100 focus:border-primary focus:ring-primary/10"
                      }`}
                      required
                      disabled={state === "loading"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 font-medium hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`text-[10px] font-bold mt-1 ${doPasswordsMatch ? "text-green-600" : "text-red-500"}`}>
                      {doPasswordsMatch ? "✓ Password cocok" : "✗ Password tidak cocok"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={state === "loading" || !isPasswordValid || !doPasswordsMatch}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {state === "loading" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan Password Baru"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
    </div>
  );
};

export default ResetPasswordPage;
