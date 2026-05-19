"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  Play,
  Lock,
  CheckCircle,
  ArrowLeft,
  Tag,
  BarChart2,
  Globe,
  Zap,
  Heart,
  Loader2,
  GraduationCap,
  MessageSquare,
  Send,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import type { EnrollmentStatusCheck } from "@/types/enrollment";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  order: number;
  isFree: boolean;
}

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: { name: string; slug: string };
  level: string;
  price: number;
  isPopular: boolean;
  totalLessons: number;
  totalMinutes: number;
  rating: number;
  reviewCount: number;
  instructor: { id: string; name: string; image: string | null; email: string };
  lessons: Lesson[];
  tags: { name: string }[];
  _count: { enrollments: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (price: number) => {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} jam ${m > 0 ? `${m} menit` : ""}`.trim() : `${m} menit`;
};

const getLevelColor = (level: string) => {
  switch (level) {
    case "Beginner":     return "bg-green-100 text-green-700";
    case "Intermediate": return "bg-blue-100 text-blue-700";
    case "Advanced":     return "bg-purple-100 text-purple-700";
    default:             return "bg-slate-100 text-slate-600";
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CourseDetailClient({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // Enrollment state
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatusCheck>({
    isEnrolled: false,
    enrollment: null,
  });
  const [statusLoading, setStatusLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  // UI state
  const [expandedLessons, setExpandedLessons] = useState(false);
  const [savedCourse, setSavedCourse] = useState(false);

  const freeLessons = course.lessons.filter((l) => l.isFree);
  const displayedLessons = expandedLessons ? course.lessons : course.lessons.slice(0, 5);

  // ─── Fetch enrollment status saat komponen mount ───────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/courses/${course.slug}/enrollment-status`);
        const data: EnrollmentStatusCheck = await res.json();
        setEnrollmentStatus(data);
        if (data.isWishlisted !== undefined) {
          setSavedCourse(data.isWishlisted);
        }
      } catch {
        // Jika gagal, anggap belum enroll (safe default)
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [course.slug]);

  // ─── Handle Save Wishlist ───────────────────────────────────────────────────
  const handleSaveCourse = async () => {
    if (!session && !sessionLoading) {
      router.push(`/auth/login?callbackUrl=/courses/${course.slug}`);
      return;
    }

    try {
      const isCurrentlySaved = savedCourse;
      // Optimistic update
      setSavedCourse(!isCurrentlySaved);

      if (isCurrentlySaved) {
        await fetch(`/api/wishlist?courseId=${course.id}`, { method: "DELETE" });
        toast.success("Dihapus dari Wishlist");
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id }),
        });
        toast.success("Disimpan ke Wishlist! ❤️");
      }
    } catch (error) {
      // Revert optimistic update on error
      setSavedCourse(savedCourse);
      toast.error("Gagal memperbarui wishlist");
    }
  };
  const handleEnroll = async () => {
    // 1. Belum login → redirect ke login
    if (!session && !sessionLoading) {
      router.push(`/auth/login?callbackUrl=/courses/${course.slug}`);
      return;
    }

    // 2. Sudah enroll (aktif/selesai) → tampilkan notif & arahkan ke halaman belajar
    if (enrollmentStatus.isEnrolled) {
      toast.info("Kamu sudah terdaftar di kursus ini! Mengarahkan ke halaman belajar...", {
        description: "Klik \"Lanjut Belajar\" untuk melanjutkan progresmu.",
        duration: 3000,
      });
      setTimeout(() => router.push(`/courses/${course.slug}/learn`), 1500);
      return;
    }

    // 2b. Enrollment pending_payment → arahkan ke checkout
    if ((enrollmentStatus as any).isPendingPayment && (enrollmentStatus as any).pendingInvoiceNumber) {
      toast.info("Kamu sudah memesan kursus ini. Mengarahkan ke halaman pembayaran...", {
        duration: 3000,
      });
      setTimeout(() => router.push(`/checkout/${(enrollmentStatus as any).pendingInvoiceNumber}`), 1000);
      return;
    }

    // 3. Proses enrollment
    setIsEnrolling(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, couponCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 409 = sudah enroll (race condition / request ganda)
        if (res.status === 409) {
          const enrollment = data.enrollment;
          if (enrollment?.enrollmentStatus === "pending_payment") {
            // Redirect ke checkout
            const invoiceRes = await fetch(`/api/courses/${course.slug}/enrollment-status`);
            const invoiceData = await invoiceRes.json();
            if (invoiceData.pendingInvoiceNumber) {
              toast.info("Tagihan sudah ada. Mengarahkan ke pembayaran...");
              router.push(`/checkout/${invoiceData.pendingInvoiceNumber}`);
            } else {
              toast.info("Kamu sudah memesan kursus ini.");
            }
          } else {
            setEnrollmentStatus({ isEnrolled: true, enrollment });
            toast.info("Kamu sudah terdaftar di kursus ini!", {
              description: "Mengarahkan ke halaman belajar...",
              duration: 3000,
            });
            setTimeout(() => router.push(`/courses/${course.slug}/learn`), 1500);
          }
          return;
        }
        throw new Error(data.error ?? "Gagal mendaftar kursus");
      }

      if (data.type === "free") {
        // Free course: langsung ke halaman belajar
        toast.success("🎉 Berhasil mendaftar! Selamat belajar!");
        setEnrollmentStatus({ isEnrolled: true, enrollment: data.enrollment });
        setTimeout(() => router.push(data.redirectUrl), 1000);
      } else {
        // Paid course: ke halaman checkout (JANGAN set isEnrolled = true)
        toast.info("Invoice berhasil dibuat. Melanjutkan ke pembayaran...");
        router.push(data.redirectUrl);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsEnrolling(false);
    }
  };

  const buttonState = (() => {
    if (sessionLoading || statusLoading) return { label: "Memuat...", disabled: true };
    if (enrollmentStatus.isEnrolled) return { label: "🎓 Lanjut Belajar", disabled: false };
    if ((enrollmentStatus as any).isPendingPayment) return { label: "⏳ Lanjutkan Pembayaran", disabled: false };
    if (isEnrolling) return { label: "Mendaftar...", disabled: true };
    if (course.price === 0 || (discountPercent > 0 && Number(course.price) * (1 - discountPercent / 100) <= 0)) return { label: "🎉 Daftar Gratis Sekarang", disabled: false };
    const finalPrice = discountPercent > 0 ? Number(course.price) * (1 - discountPercent / 100) : course.price;
    return { label: `Enroll — ${formatPrice(finalPrice)}`, disabled: false };
  })();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* ── HERO / HEADER ── */}
      <section className="bg-[#100E2E] text-white pt-10 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/40 mb-6 font-medium">
            <Link href="/" className="hover:text-white/70 transition-colors">Beranda</Link>
            <ChevronRight size={12} />
            <Link href="/courses" className="hover:text-white/70 transition-colors">Kursus</Link>
            <ChevronRight size={12} />
            <span className="text-white/60">{course.category.name}</span>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
            {/* LEFT: Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course.isPopular && (
                  <span className="bg-[#FF6B4A] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> Populer
                  </span>
                )}
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/70">
                  {course.category.name}
                </span>
                {enrollmentStatus.isEnrolled && (
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                    <CheckCircle size={10} /> Sudah Terdaftar
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4 tracking-tight">
                {course.title}
              </h1>
              <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-2xl">
                {course.description}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-5 text-sm mb-6">
                <div className="flex items-center gap-1.5">
                  <Star size={16} fill="#FBBF24" className="text-yellow-400" />
                  <span className="font-bold">{course.rating.toFixed(1)}</span>
                  <span className="text-white/40">({course.reviewCount} ulasan)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Users size={14} />
                  <span>{course._count.enrollments.toLocaleString("id-ID")} siswa</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <BookOpen size={14} />
                  <span>{course.totalLessons} materi</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Clock size={14} />
                  <span>{formatDuration(course.totalMinutes)}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <img
                  src={course.instructor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructor.name}`}
                  alt={course.instructor.name}
                  className="w-10 h-10 rounded-full bg-white/10"
                />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Instruktur</p>
                  <p className="text-sm font-bold text-white">{course.instructor.name}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Purchase Card (desktop) */}
            <div className="hidden lg:block">
              <PurchaseCard
                course={course}
                freeLessons={freeLessons.length}
                buttonState={buttonState}
                isEnrolling={isEnrolling}
                savedCourse={savedCourse}
                isEnrolled={enrollmentStatus.isEnrolled}
                certificateId={enrollmentStatus.enrollment?.certificate?.id}
                onEnroll={handleEnroll}
                onSave={handleSaveCourse}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div className="space-y-10">

            {/* Enrolled Banner */}
            {enrollmentStatus.isEnrolled && (
              <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800">Kamu sudah terdaftar di kursus ini!</p>
                  <p className="text-sm text-green-600">
                    Terdaftar sejak {new Date(enrollmentStatus.enrollment!.enrolledAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {enrollmentStatus.enrollment?.enrollmentStatus === "completed" && enrollmentStatus.enrollment?.certificate && (
                    <button
                      onClick={() => window.open(`/certificates/${enrollmentStatus.enrollment?.certificate?.id}`, '_blank')}
                      className="px-5 py-2.5 bg-yellow-500 text-white font-bold rounded-xl text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                    >
                      <Award size={16} /> Lihat Sertifikat
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/courses/${course.slug}/learn`)}
                    className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    Lanjut Belajar <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                <CheckCircle size={20} className="text-[#FF6B4A]" /> Apa yang Akan Kamu Pelajari
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-6">
                {[
                  "Memahami konsep fundamental dari awal",
                  "Praktik langsung dengan proyek nyata",
                  "Best practice standar industri",
                  "Tips & trik dari instruktur profesional",
                  "Portfolio siap untuk melamar kerja",
                  `Sertifikat ${course.category.name} dari Learnify`,
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {/* Course Stats */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                <BarChart2 size={20} className="text-[#FF6B4A]" /> Detail Kursus
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: <BookOpen size={20} />, label: "Total Materi", value: `${course.totalLessons} Lesson` },
                  { icon: <Clock size={20} />, label: "Total Durasi", value: formatDuration(course.totalMinutes) },
                  { icon: <Award size={20} />, label: "Level", value: course.level },
                  { icon: <Globe size={20} />, label: "Bahasa", value: "Indonesia" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center text-center bg-slate-50 rounded-2xl p-4 gap-2">
                    <div className="text-[#FF6B4A]">{stat.icon}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    <p className="font-black text-slate-800 text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Silabus */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-[#FF6B4A]" /> Silabus Kursus
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {freeLessons.length} gratis · {course.totalLessons} total
                </span>
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                {displayedLessons.map((lesson, idx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    isEnrolled={enrollmentStatus.isEnrolled}
                    courseSlug={course.slug}
                  />
                ))}
              </div>
              {course.lessons.length > 5 && (
                <button
                  onClick={() => setExpandedLessons(!expandedLessons)}
                  className="mt-4 w-full py-3 text-sm font-bold text-[#FF6B4A] border-2 border-dashed border-orange-200 rounded-2xl hover:bg-orange-50 transition-colors"
                >
                  {expandedLessons
                    ? "Sembunyikan materi"
                    : `Tampilkan ${course.lessons.length - 5} materi lainnya`}
                </button>
              )}
            </section>

            {/* Tags */}
            {course.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Tag size={20} className="text-[#FF6B4A]" /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-orange-50 hover:text-[#FF6B4A] transition-colors"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <ReviewSection
              courseSlug={course.slug}
              isEnrolled={enrollmentStatus.isEnrolled}
              averageRating={course.rating}
              reviewCount={course.reviewCount}
            />

            {/* Instructor */}
            <section className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-3xl p-6">
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                <Users size={20} className="text-[#FF6B4A]" /> Tentang Instruktur
              </h2>
              <div className="flex items-start gap-4">
                <img
                  src={course.instructor.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructor.name}`}
                  alt={course.instructor.name}
                  className="w-16 h-16 rounded-2xl bg-slate-200 flex-shrink-0"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{course.instructor.name}</h3>
                  <p className="text-sm text-[#FF6B4A] font-bold mb-2">Instruktur {course.category.name}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Instruktur profesional dengan pengalaman bertahun-tahun di industri. Fokus pada pembelajaran praktis yang langsung bisa diterapkan.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Sticky Purchase Card (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <PurchaseCard
                course={course}
                freeLessons={freeLessons.length}
                buttonState={buttonState}
                isEnrolling={isEnrolling}
                savedCourse={savedCourse}
                isEnrolled={enrollmentStatus.isEnrolled}
                certificateId={enrollmentStatus.enrollment?.certificate?.id}
                onEnroll={handleEnroll}
                onSave={handleSaveCourse}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-xl z-50">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {enrollmentStatus.isEnrolled ? "Status" : "Harga"}
            </p>
            <p className={`text-lg font-black ${enrollmentStatus.isEnrolled ? "text-green-600" : course.price === 0 ? "text-green-600" : "text-slate-900"}`}>
              {enrollmentStatus.isEnrolled ? "Sudah Enroll ✓" : formatPrice(course.price)}
            </p>
          </div>
          <button
            onClick={handleEnroll}
            disabled={buttonState.disabled}
            className="flex-1 h-12 bg-[#FF6B4A] text-white font-black rounded-2xl hover:bg-[#fa5a35] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isEnrolling ? (
              <Loader2 size={20} className="animate-spin" />
            ) : enrollmentStatus.isEnrolled ? (
              <><GraduationCap size={18} /> Lanjut Belajar</>
            ) : (enrollmentStatus as any).isPendingPayment ? (
              <>⏳ Lanjutkan Pembayaran <ChevronRight size={18} /></>
            ) : (
              <>{course.price === 0 ? "Daftar Gratis" : "Enroll Sekarang"} <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>

      <div className="pb-24 lg:pb-0" />
      <Footer />
    </div>
  );
}

// ─── Purchase Card ─────────────────────────────────────────────────────────────
function PurchaseCard({
  course,
  freeLessons,
  buttonState,
  isEnrolling,
  savedCourse,
  isEnrolled,
  certificateId,
  onEnroll,
  onSave,
  couponCode,
  setCouponCode,
  discountPercent,
  setDiscountPercent,
}: {
  course: CourseDetail;
  freeLessons: number;
  buttonState: { label: string; disabled: boolean };
  isEnrolling: boolean;
  savedCourse: boolean;
  isEnrolled: boolean;
  certificateId?: number;
  onEnroll: () => void;
  onSave: () => void;
  couponCode?: string;
  setCouponCode?: (code: string) => void;
  discountPercent?: number;
  setDiscountPercent?: (percent: number) => void;
}) {
  const [isValidating, setIsValidating] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode || !setDiscountPercent) return;
    setIsValidating(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscountPercent(data.coupon.discountPercent);
        toast.success(`Kupon diterapkan! Diskon ${data.coupon.discountPercent}%`);
      } else {
        setDiscountPercent(0);
        toast.error(data.error || "Kupon tidak valid");
      }
    } catch {
      setDiscountPercent(0);
      toast.error("Gagal memvalidasi kupon");
    } finally {
      setIsValidating(false);
    }
  };

  const finalPrice = discountPercent && discountPercent > 0 
    ? Math.max(0, Number(course.price) * (1 - discountPercent / 100)) 
    : course.price;

  return (
    <div className={`bg-white rounded-3xl border overflow-hidden shadow-2xl shadow-slate-200/60 ${isEnrolled ? "border-green-200" : "border-slate-100"}`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-[#100E2E] to-[#FF6B4A]/30 relative flex items-center justify-center">
        {isEnrolled ? (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-400/50">
              <GraduationCap size={28} className="text-green-400" />
            </div>
            <p className="text-white/60 text-xs font-bold">Kamu terdaftar di kursus ini</p>
          </div>
        ) : (
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        )}
        {!isEnrolled && (
          <div className="absolute bottom-3 left-3 text-white/60 text-[10px] font-bold">
            Preview Gratis ({freeLessons} materi)
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Price / Status */}
        <div className="flex items-end justify-between">
          <div>
            {isEnrolled ? (
              <>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Status</p>
                <p className="text-2xl font-black text-green-600 flex items-center gap-2">
                  <CheckCircle size={22} /> Sudah Terdaftar
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  {course.price === 0 ? "Kursus ini" : "Harga"}
                </p>
                <p className={`text-3xl font-black ${finalPrice === 0 ? "text-green-600" : "text-slate-900"}`}>
                  {formatPrice(finalPrice)}
                </p>
                {discountPercent && discountPercent > 0 ? (
                  <p className="text-xs text-slate-400 line-through mt-1">
                    {formatPrice(course.price)}
                  </p>
                ) : null}
              </>
            )}
          </div>
          {!isEnrolled && course.price > 0 && discountPercent && discountPercent > 0 ? (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Diskon {discountPercent}%</span>
          ) : !isEnrolled && course.price > 0 ? (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Penawaran Spesial</span>
          ) : null}
        </div>

        {/* Kupon Input */}
        {!isEnrolled && course.price > 0 && setCouponCode && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Masukkan Kupon"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                if (setDiscountPercent) setDiscountPercent(0);
              }}
              className="flex-1 h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all uppercase"
            />
            <button
              onClick={applyCoupon}
              disabled={!couponCode || isValidating || (discountPercent ?? 0) > 0}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-bold text-xs rounded-xl transition-colors"
            >
              {isValidating ? <Loader2 size={14} className="animate-spin" /> : discountPercent && discountPercent > 0 ? "Dipakai" : "Terapkan"}
            </button>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onEnroll}
            disabled={buttonState.disabled}
            className={`w-full h-13 font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 py-4 shadow-lg ${
              isEnrolled
                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200/50"
                : "bg-[#FF6B4A] hover:bg-[#fa5a35] text-white shadow-orange-200/50"
            }`}
          >
            {isEnrolling ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>{buttonState.label} {!isEnrolled && <ChevronRight size={18} />}</>
            )}
          </button>

          {isEnrolled && certificateId && (
            <button
              onClick={() => window.open(`/certificates/${certificateId}`, '_blank')}
              className="w-full h-11 border-2 border-yellow-400 bg-yellow-50 text-yellow-600 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:bg-yellow-100 mt-2"
            >
              <Award size={16} /> Lihat Sertifikat
            </button>
          )}

          {!isEnrolled && (
            <button
              onClick={onSave}
              className={`w-full h-11 border-2 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                savedCourse
                  ? "border-red-200 text-red-500 bg-red-50"
                  : "border-slate-200 text-slate-600 hover:border-orange-200"
              }`}
            >
              <Heart size={16} fill={savedCourse ? "currentColor" : "none"} />
              {savedCourse ? "Tersimpan" : "Simpan untuk Nanti"}
            </button>
          )}
        </div>

        {/* What's included */}
        <div className="border-t border-slate-50 pt-4 space-y-2.5">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Yang Kamu Dapatkan:</p>
          {[
            { icon: <BookOpen size={14} />, text: `${course.totalLessons} materi video` },
            { icon: <Clock size={14} />, text: `${formatDuration(course.totalMinutes)} konten` },
            { icon: <Globe size={14} />, text: "Akses seumur hidup" },
            { icon: <Award size={14} />, text: "Sertifikat penyelesaian" },
            { icon: <Users size={14} />, text: "Akses komunitas Discord" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5 text-xs text-slate-600">
              <span className="text-[#FF6B4A]">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <Link
          href="/courses"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors justify-center pt-2"
        >
          <ArrowLeft size={12} /> Lihat kursus lainnya
        </Link>
      </div>
    </div>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  index,
  isEnrolled,
  courseSlug,
}: {
  lesson: Lesson;
  index: number;
  isEnrolled: boolean;
  courseSlug: string;
}) {
  const isAccessible = lesson.isFree || isEnrolled;

  const content = (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors ${
        index > 0 ? "border-t border-slate-50" : ""
      } ${isAccessible ? "hover:bg-orange-50/50 cursor-pointer" : "bg-white cursor-not-allowed"}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${
        isAccessible ? "bg-orange-100 text-[#FF6B4A]" : "bg-slate-100 text-slate-400"
      }`}>
        {isAccessible ? <Play size={12} fill="currentColor" /> : <Lock size={12} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isAccessible ? "text-slate-800" : "text-slate-400"}`}>
          {lesson.order}. {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{lesson.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {lesson.isFree && !isEnrolled && (
          <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase">Gratis</span>
        )}
        {isEnrolled && (
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">Buka</span>
        )}
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Clock size={10} /> {lesson.duration}m
        </span>
      </div>
    </div>
  );

  if (isAccessible) {
    return (
      <Link href={`/courses/${courseSlug}/learn?lesson=${lesson.id}`}>
        {content}
      </Link>
    );
  }
  return content;
}

// ─── Review Section ────────────────────────────────────────────────────────────
function ReviewSection({
  courseSlug,
  isEnrolled,
  averageRating,
  reviewCount,
}: {
  courseSlug: string;
  isEnrolled: boolean;
  averageRating: number;
  reviewCount: number;
}) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [submitRating, setSubmitRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseSlug}/reviews?limit=5`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setDistribution(data.meta?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseSlug]);

  const handleSubmitReview = async () => {
    if (submitRating < 1) {
      toast.error("Pilih rating terlebih dahulu (1-5 bintang)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: submitRating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim ulasan");
      toast.success("✅ Ulasan berhasil dikirim! Terima kasih.");
      setSubmitted(true);
      // Refresh reviews
      const reviewsRes = await fetch(`/api/courses/${courseSlug}/reviews?limit=5`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews ?? []);
      setDistribution(reviewsData.meta?.distribution ?? distribution);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalForBar = Math.max(1, ...Object.values(distribution));

  return (
    <section>
      <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
        <MessageSquare size={20} className="text-[#FF6B4A]" /> Ulasan Siswa
      </h2>

      {/* Rating Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 bg-slate-50 rounded-2xl p-6 mb-6">
        <div className="text-center">
          <p className="text-6xl font-black text-[#2D2D2D]">{averageRating.toFixed(1)}</p>
          <div className="flex items-center gap-0.5 justify-center my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= Math.round(averageRating) ? "text-yellow-400" : "text-slate-200"}
                fill={s <= Math.round(averageRating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-bold">{reviewCount} ulasan</p>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 w-3">{star}</span>
              <Star size={10} className="text-yellow-400" fill="currentColor" />
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${((distribution[star] ?? 0) / totalForBar) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-400 w-4 text-right">{distribution[star] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Review Form (hanya untuk yang sudah enroll) */}
      {isEnrolled && !submitted && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
          <p className="font-black text-slate-800 mb-3">Berikan Ulasanmu 🌟</p>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSubmitRating(s)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={(hoverRating || submitRating) >= s ? "text-yellow-400" : "text-slate-200"}
                  fill={(hoverRating || submitRating) >= s ? "currentColor" : "none"}
                />
              </button>
            ))}
            {submitRating > 0 && (
              <span className="text-sm font-bold text-slate-500 ml-2">
                {["😡 Buruk", "😕 Kurang", "😐 Cukup", "😊 Bagus", "🤩 Sangat Bagus!"][submitRating - 1]}
              </span>
            )}
          </div>
          <textarea
            placeholder="Ceritakan pengalamanmu belajar di kursus ini... (opsional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full bg-white border border-orange-100 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || submitRating < 1}
            className="mt-3 px-6 py-2.5 bg-[#FF6B4A] text-white font-black rounded-xl text-sm hover:bg-[#fa5a35] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Kirim Ulasan
          </button>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500" />
          <p className="text-sm font-bold text-green-700">Ulasanmu sudah terkirim. Terima kasih! 🎉</p>
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">Belum ada ulasan untuk kursus ini</p>
          {isEnrolled && <p className="text-xs mt-1">Jadilah yang pertama memberikan ulasan!</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="flex gap-4 p-4 bg-slate-50/60 rounded-2xl">
              <img
                src={review.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.name}`}
                alt={review.user.name}
                className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-slate-800 text-sm">{review.user.name}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        className={s <= review.rating ? "text-yellow-400" : "text-slate-200"}
                        fill={s <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(review.createdDate).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
