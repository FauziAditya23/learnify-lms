"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Lock,
  Tag,
  PlayCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface CourseInfo {
  title: string;
  slug?: string;
  thumbnail?: string | null;
  level: string;
  price: number;
  categoryName?: string;
  instructorName?: string;
  instructorImage?: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  discountAmt?: number;
  invoiceStatus: string;
  dueDate: string;
  course?: CourseInfo;
}

interface Props {
  invoice: Invoice;
}

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

// ── Countdown Hook ────────────────────────────────────────────────────────────
function useCountdown(targetDateStr: string) {
  const calcRemaining = useCallback(() => {
    const diff = new Date(targetDateStr).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, isExpired: true, totalMs: 0 };
    const totalSeconds = Math.floor(diff / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isExpired: false,
      totalMs: diff,
    };
  }, [targetDateStr]);

  const [countdown, setCountdown] = useState(calcRemaining);

  useEffect(() => {
    if (countdown.isExpired) return;
    const interval = setInterval(() => {
      const next = calcRemaining();
      setCountdown(next);
      if (next.isExpired) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining, countdown.isExpired]);

  return countdown;
}

// ── Urgency levels ─────────────────────────────────────────────────────────────
function getUrgencyStyle(totalMs: number) {
  const hours = totalMs / (1000 * 3600);
  if (hours <= 1) return { bg: "bg-red-500", text: "text-red-600", border: "border-red-200", label: "Segera bayar!" };
  if (hours <= 6) return { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", label: "Hampir habis" };
  return { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", label: "Batas pembayaran" };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CheckoutClient({ invoice }: Props) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "failed" | "expired">(
    invoice.invoiceStatus === "paid" ? "success" :
    invoice.invoiceStatus === "cancelled" ? "expired" : "idle"
  );

  const countdown = useCountdown(invoice.dueDate);
  const urgency = getUrgencyStyle(countdown.totalMs);

  // Auto-set expired when countdown hits zero
  useEffect(() => {
    if (countdown.isExpired && paymentStatus === "idle") {
      setPaymentStatus("expired");
    }
  }, [countdown.isExpired, paymentStatus]);

  // ── Polling: Auto-detect Virtual Account payment completion ─────────────────
  // Midtrans VA payments are async — user transfers externally, webhook updates DB.
  // We poll every 5s while status is "pending" so UI updates without manual refresh.
  useEffect(() => {
    if (paymentStatus !== "pending") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/status?invoiceNumber=${invoice.invoiceNumber}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid") {
          setPaymentStatus("success");
          toast.success("🎉 Pembayaran terkonfirmasi! Kamu sekarang bisa mulai belajar.");
        } else if (data.status === "cancelled" || data.isExpired) {
          setPaymentStatus("expired");
        }
      } catch {
        // Silent fail — polling will retry on next interval
      }
    };

    // Poll immediately once, then every 5 seconds
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [paymentStatus, invoice.invoiceNumber]);

  // Inject Midtrans Snap.js
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

  useEffect(() => {
    if (!clientKey) return;
    const scriptId = "midtrans-snap";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.head.appendChild(script);
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [clientKey, isProduction]);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const pad = (n: number) => String(n).padStart(2, "0");

  const handlePay = async () => {
    if (countdown.isExpired) {
      toast.error("Tagihan ini sudah kadaluarsa. Silakan buat pesanan baru.");
      setPaymentStatus("expired");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      });

      if (!res.ok) {
        const err = await res.json();
        // Handle expired response from server
        if (res.status === 410 || err.code === "INVOICE_EXPIRED") {
          setPaymentStatus("expired");
          toast.error("Tagihan ini sudah kadaluarsa.", {
            description: "Silakan kembali ke halaman kursus dan buat pesanan baru.",
          });
          return;
        }
        throw new Error(err.error ?? "Gagal membuat token pembayaran");
      }

      const { snapToken } = await res.json();

      if (!window.snap) {
        throw new Error("Midtrans Snap.js belum dimuat. Coba refresh halaman.");
      }

      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log("[Midtrans] Payment success:", result);
          setPaymentStatus("success");
          toast.success("🎉 Pembayaran berhasil! Kamu sekarang bisa mulai belajar.");
        },
        onPending: (result) => {
          console.log("[Midtrans] Payment pending:", result);
          setPaymentStatus("pending");
          toast.info("⏳ Pembayaran sedang diproses. Halaman akan otomatis update setelah pembayaran dikonfirmasi.");
        },
        onError: (result) => {
          console.error("[Midtrans] Payment error:", result);
          setPaymentStatus("failed");
          toast.error("❌ Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          toast.info("Popup ditutup. Kamu bisa membayar kapan saja sebelum jatuh tempo.");
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const course = invoice.course;
  const isExpired = paymentStatus === "expired" || countdown.isExpired;
  const isPaid = paymentStatus === "success";
  const canPay = !isExpired && !isPaid && invoice.invoiceStatus !== "cancelled";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500 w-5 h-5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 md:px-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left Column: Order Summary ── */}
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight mb-2">
                Ringkasan Pesanan
              </h1>
              <p className="text-slate-500 font-medium">Periksa kembali detail kursus yang akan kamu beli.</p>
            </div>

            {course ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-48 h-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative group">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-300">
                        <GraduationCap size={40} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">{course.categoryName || "Kursus"}</span>
                      <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider">{course.level}</span>
                    </div>
                    <h3 className="text-lg font-black text-[#0F172A] leading-tight mb-3">{course.title}</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                        <img src={course.instructorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructorName}`} alt="Instructor" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">Oleh {course.instructorName || "Instruktur Learnify"}</span>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-slate-100" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium text-sm">Harga Normal</span>
                    <span className="font-bold">{formatIDR(course.price)}</span>
                  </div>
                  {(invoice.discountAmt ?? 0) > 0 && (
                    <div className="flex justify-between items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <span className="font-bold text-sm flex items-center gap-1.5"><Tag size={14} /> Diskon Kupon</span>
                      <span className="font-black">-{formatIDR(invoice.discountAmt!)}</span>
                    </div>
                  )}
                  {(() => {
                    const priceAfterDiscount = Math.round(Number(invoice.totalAmount) / 1.11);
                    const ppnAmt = Number(invoice.totalAmount) - priceAfterDiscount;
                    return (
                      <div className="flex justify-between items-center text-slate-500">
                        <span className="font-medium text-sm">PPN (11%)</span>
                        <span className="font-bold">{formatIDR(ppnAmt)}</span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-black text-slate-800 text-lg">Total Tagihan</span>
                    <span className="font-black text-2xl text-[#FF6B4A]">{formatIDR(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                <p className="text-slate-500">Detail kursus tidak tersedia.</p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                <Lock className="text-slate-400 w-8 h-8" />
                <div>
                  <p className="font-bold text-slate-700 text-xs">Pembayaran Aman</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Enkripsi 256-bit SSL</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                <Sparkles className="text-amber-500 w-8 h-8" />
                <div>
                  <p className="font-bold text-slate-700 text-xs">Akses Selamanya</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Termasuk pembaruan</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Payment Gateway ── */}
          <div className="w-full lg:w-[420px]">

            {/* ── Countdown Timer ── */}
            {canPay && (
              <div className={`mb-6 rounded-3xl p-5 border ${urgency.border} bg-white shadow-sm`}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className={`w-4 h-4 ${urgency.text}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${urgency.text}`}>
                    {urgency.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  {[{ val: countdown.hours, label: "Jam" }, { val: countdown.minutes, label: "Menit" }, { val: countdown.seconds, label: "Detik" }].map((item, i) => (
                    <React.Fragment key={item.label}>
                      <div className="text-center">
                        <div className={`w-16 h-16 ${urgency.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-black text-2xl tabular-nums">{pad(item.val)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">{item.label}</p>
                      </div>
                      {i < 2 && <span className={`text-2xl font-black ${urgency.text} mb-5`}>:</span>}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
                  Bayar sebelum: <strong>{formatDate(invoice.dueDate)}</strong>
                </p>
              </div>
            )}

            {/* Status Banners */}
            {isPaid && (
              <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 shadow-lg shadow-green-200 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-lg">Lunas! 🎉</p>
                    <p className="text-green-100 text-xs font-medium">Terima kasih atas pembelian Anda.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(course?.slug ? `/courses/${course.slug}/learn` : "/dashboard/student")}
                  className="w-full py-3 bg-white text-green-700 hover:bg-green-50 rounded-xl font-black text-sm transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  <PlayCircle size={18} /> Mulai Belajar Sekarang
                </button>
              </div>
            )}

            {isExpired && (
              <div className="mb-6 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Tagihan Kadaluarsa</p>
                    <p className="text-xs text-slate-500 mt-0.5">Batas pembayaran sudah terlewati.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(course?.slug ? `/courses/${course.slug}` : "/courses")}
                  className="w-full py-3 bg-[#FF6B4A] hover:bg-[#fa5a35] text-white rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Buat Pesanan Baru
                </button>
              </div>
            )}

            {paymentStatus === "failed" && !isExpired && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shrink-0">
                  <XCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-red-800">Pembayaran Gagal</p>
                  <p className="text-xs text-red-600 mt-0.5">Silakan coba lagi dengan metode lain.</p>
                </div>
              </div>
            )}

            {paymentStatus === "pending" && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                  <Clock size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-amber-800">Menunggu Konfirmasi Pembayaran</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Lakukan transfer Virtual Account, halaman ini akan otomatis update setelah pembayaran dikonfirmasi.
                  </p>
                </div>
                <Loader2 size={20} className="text-amber-500 animate-spin shrink-0" />
              </div>
            )}

            {/* Invoice Payment Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-24">
              <div className={`p-8 text-white relative overflow-hidden ${isExpired ? "bg-slate-600" : "bg-[#100E2E]"}`}>
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Pembayaran</p>
                  <p className="font-black text-4xl mb-1">{formatIDR(invoice.totalAmount)}</p>
                  <p className="text-slate-500 text-xs font-medium">No. Invoice: {invoice.invoiceNumber}</p>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-[#FF6B4A]/20 rounded-full blur-xl" />
              </div>

              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-sm font-black ${isPaid ? "text-green-600" : isExpired ? "text-slate-500" : "text-orange-500"}`}>
                      {isPaid ? "✓ LUNAS" : isExpired ? "✗ KADALUARSA" : "⏳ MENUNGGU PEMBAYARAN"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Batas Pembayaran</p>
                    <p className={`text-sm font-bold ${isExpired ? "text-red-500 line-through" : "text-slate-700"}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>

                {canPay && (
                  <button
                    onClick={handlePay}
                    disabled={isLoading || !clientKey}
                    className="w-full h-14 bg-[#FF6B4A] hover:bg-[#fa5a35] text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><CreditCard size={20} /> Bayar via Midtrans</>}
                  </button>
                )}

                {isPaid && !isExpired && (
                  <button
                    onClick={() => router.push("/dashboard/student/purchases")}
                    className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Lihat Riwayat Pembelian
                  </button>
                )}

                {isExpired && (
                  <button
                    onClick={() => router.push(course?.slug ? `/courses/${course.slug}` : "/courses")}
                    className="w-full h-14 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} /> Kembali ke Halaman Kursus
                  </button>
                )}

                {!clientKey && canPay && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-center text-[10px] font-bold text-red-600">
                      ⚠️ Midtrans Client Key belum dikonfigurasi di environment (.env).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
