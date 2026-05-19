"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Chrome, ChevronRight, X, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);

  // Parse error dari query parameter saat komponen mount
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "session_invalid") {
      setError("Sesi Anda tidak valid. Silakan login kembali.");
    }
    
    // Cek jika baru saja mendaftar
    const registered = searchParams.get("registered");
    if (registered === "true") {
      // Kita bisa menggunakan state khusus atau sekadar menampilkan info
    }
  }, [searchParams]);


  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      // Better Auth akan redirect otomatis via OAuth flow
      // tidak perlu handle di sini
    } catch {
      setError("Gagal masuk dengan Google. Silakan coba lagi.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUserNotFound(false);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        // Gunakan callbackURL agar redirect konsisten dengan Google login
        callbackURL: "/dashboard",
      });

      if (authError) {
        setUserNotFound(true);
        setError("Email atau password tidak valid.");
        setIsLoading(false);
        return;
      }

      // Jika tidak ada error dan tidak ada redirect otomatis (non-2FA)
      // Lakukan redirect manual
      if (data?.url) {
        window.location.href = data.url;
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans overflow-hidden selection:bg-primary/20">
      
      {/* --- LEFT SIDE: Spatial Glass Environment --- */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-white border-r border-slate-100">
        {/* Immersive Spatial Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-400/20 mix-blend-multiply filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/15 mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Content */}
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
              Mulai Petualangan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Belajar Anda
              </span>
            </h2>
            <p className="text-slate-600 text-lg font-medium leading-relaxed">
              Platform pembelajaran premium untuk mengakses ratusan kursus eksklusif, dipandu oleh pakar industri.
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: Elegant Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white/80 backdrop-blur-sm z-10 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 duration-300">
                <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
              </div>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Selamat Datang
            </h1>
            <p className="text-slate-500 font-medium">
              Silakan masuk ke akun Anda.
            </p>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all mb-8 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span className="text-sm">{isGoogleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
          </button>

          <div className="flex items-center gap-4 mb-8 opacity-70">
            <div className="h-[1px] bg-slate-200 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atau gunakan email</span>
            <div className="h-[1px] bg-slate-200 flex-1" />
          </div>

          {/* Banners */}
          {searchParams.get("registered") === "true" && !error && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-900 text-sm">Pendaftaran Berhasil</p>
                <p className="text-green-700 text-xs mt-1">Silakan masuk menggunakan akun baru Anda.</p>
              </div>
            </div>
          )}

          {userNotFound && (
            <div className="mb-8 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 text-sm">Akun tidak ditemukan</p>
                <p className="text-orange-800 text-xs mt-1">Email atau password yang Anda masukkan salah.</p>
                <Link
                  href={`/auth/register?email=${encodeURIComponent(email)}`}
                  className="inline-block mt-2 text-primary text-xs font-bold hover:underline"
                >
                  Buat akun baru &rarr;
                </Link>
              </div>
            </div>
          )}

          {error && !userNotFound && (
            <div className="mb-8 flex gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
                  Lupa?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-11 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-bold transition-all mt-8 shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 mt-10">
            Belum memiliki akun?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:text-primary/80 transition-colors">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
