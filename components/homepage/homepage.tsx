"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";
import Footer from "@/components/footer";
import Navbar from "../navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#1E1E1E] font-sans">
      <Navbar />
      <main className="max-w-[1440px] mx-auto overflow-hidden">
        {/* --- HERO SECTION --- */}
        <section className="px-4 sm:px-6 md:px-12 py-10 md:py-20 flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative overflow-hidden">
          <div className="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
            <div className="inline-block">
              <span className="bg-orange-50 text-[#FF6B4A] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide">
                Investasi Terbaik Adalah Ilmu
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.15] tracking-tight">
              Kuasai keahlian baru <br className="hidden sm:inline" />
              kapanpun Anda mau <br />
              <span className="text-[#FF6B4A]">bersama Learnify</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Jadilah versi terbaik diri Anda dengan akses materi eksklusif.
              Kami hadir untuk memastikan perjalanan belajar Anda menjadi lebih
              mudah, fleksibel, dan tanpa batas.
            </p>

            {/* Responsive Search and Category Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-2 bg-white shadow-2xl shadow-slate-200 rounded-2xl sm:rounded-3xl max-w-xl mx-auto lg:mx-0 border border-slate-100 gap-2 sm:gap-0">
              <div className="px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-slate-100 text-slate-500 font-bold flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-xs sm:text-sm shrink-0">
                <span>Kategori</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Mau belajar apa hari ini?"
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-0 outline-none text-slate-700 placeholder-slate-300 w-full text-xs sm:text-sm"
              />
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl h-11 sm:h-12 px-6 sm:px-8 font-bold flex gap-2 justify-center items-center">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" /> <span>Temukan</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full relative max-w-md lg:max-w-none mx-auto">
            <div className="relative w-full aspect-[4/3] sm:aspect-square lg:h-[550px] bg-gradient-to-br from-[#FFEDEB] to-[#FFF5F4] rounded-[2rem] sm:rounded-[3rem] overflow-visible flex items-end justify-center">
              <div className="relative z-10 w-[80%] h-[85%] bg-slate-200 rounded-t-full overflow-hidden border-4 sm:border-8 border-white border-b-0">
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070"
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Decorative Icons (Responsive Placement) */}
              <div className="absolute top-10 sm:top-20 -left-2 sm:-left-6 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="text-base sm:text-xl">🚀</div>
              </div>
              <div className="absolute top-20 sm:top-32 -right-2 sm:-right-4 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="text-base sm:text-xl">✨</div>
              </div>
              <div className="absolute bottom-28 sm:bottom-40 -left-4 sm:-left-10 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="text-base sm:text-xl">🏆</div>
              </div>
              <div className="absolute bottom-6 sm:bottom-10 -right-4 sm:-right-8 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl text-center">
                <div className="text-[#8B5CF6] text-[9px] sm:text-xs font-bold leading-tight">
                  A+ <br /> Top
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION (Video & Classes) --- */}
        <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-12">
          <div className="text-center space-y-4 mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1E1B4B] leading-tight">
              Belajar tanpa hambatan dengan <br className="hidden sm:inline" /> kualitas visual premium
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed text-xs sm:text-sm">
              Kami percaya kualitas materi menentukan kecepatan pemahaman.
              Nikmati setiap modul dengan resolusi terbaik yang memanjakan mata,
              audio yang presisi, serta sesi interaksi langsung yang mendalam.
            </p>
            <div className="pt-2">
              <Button className="bg-[#A855F7] hover:bg-[#9333EA] text-white px-8 sm:px-10 h-11 sm:h-12 rounded-xl font-bold transition-all shadow-lg shadow-purple-100">
                Eksplorasi Kelas
              </Button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 grid grid-cols-6 gap-2 opacity-20 hidden md:grid">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-orange-600 rounded-full" />
              ))}
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden">
              <div className="relative aspect-video rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1544531585-9847b68c8c86?q=80&w=2070"
                  alt="Live Session"
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-4 left-4 w-20 sm:w-32 md:w-44 aspect-[3/4] rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1972"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                  <button className="w-9 h-9 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
                    <span className="sr-only">Tutup</span>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.04 19.75 19.75 0 0 1-6.14-6.14 19.8 19.8 0 0 1-3.04-8.62 2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72 12.81 12.81 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z"></path>
                    </svg>
                  </button>
                  <button className="w-9 h-9 sm:w-12 sm:h-12 bg-[#A855F7] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="bg-[#FFF5F4] p-5 sm:p-6 rounded-2xl flex items-center gap-4 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-orange-100">
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </div>
                <span className="font-bold text-slate-800 text-sm sm:text-base">Siniar Belajar</span>
              </div>

              <div className="bg-[#F5F3FF] p-5 sm:p-6 rounded-2xl flex items-center gap-4 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-purple-100">
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[9px] sm:text-[10px] font-black">((●))</span>
                    <span className="text-[7px] sm:text-[8px] font-bold uppercase">
                      Aktif
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm sm:text-base">
                  Kelas Interaktif
                </span>
              </div>

              <div className="bg-[#F0FDF4] p-5 sm:p-6 rounded-2xl flex items-center gap-4 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-green-100">
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white fill-white ml-0.5" />
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm sm:text-base">Library Video</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- QUALIFIED LESSONS SECTION --- */}
        <section className="py-16 md:py-24 bg-[#FDFDFF]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12">
            {/* Header Section */}
            <div className="text-center space-y-4 mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Kurikulum terkurasi untuk masa depan
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
                Pilih jenjang yang sesuai dengan ambisi Anda. Dari dasar hingga
                mahir, setiap materi disusun oleh para ahli di bidangnya untuk
                memastikan hasil belajar yang maksimal.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-10 sm:mb-16">
              <button className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-600 border-2 border-transparent hover:border-orange-100 hover:bg-orange-50/30 hover:text-[#FF6B4A] hover:scale-105 active:scale-95 transition-all duration-300">
                Level Dasar
              </button>
              <button className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-600 border-2 border-transparent hover:border-orange-100 hover:bg-orange-50/30 hover:text-[#FF6B4A] hover:scale-105 active:scale-95 transition-all duration-300">
                Level Menengah
              </button>
              <button className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-600 border-2 border-transparent hover:border-orange-100 hover:bg-orange-50/30 hover:text-[#FF6B4A] hover:scale-105 active:scale-95 transition-all duration-300">
                Level Profesional
              </button>
            </div>

            {/* Lesson Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  id: 1,
                  title: "Modul Dasar",
                  color: "bg-orange-400",
                  desc: "Membangun pondasi berpikir kritis dengan 7 pilar utama pembelajaran...",
                },
                {
                  id: 2,
                  title: "Modul Teknis",
                  color: "bg-slate-700",
                  desc: "Mengembangkan kemampuan teknis secara mendalam melalui praktik nyata...",
                },
                {
                  id: 3,
                  title: "Modul Strategis",
                  color: "bg-emerald-400",
                  desc: "Penerapan strategi dalam dunia profesional dengan standar kualitas tinggi...",
                },
                {
                  id: 4,
                  title: "Modul Dukungan",
                  color: "bg-slate-800",
                  desc: "Menyediakan layanan bantuan dan pendampingan khusus bagi peserta didik...",
                },
                {
                  id: 5,
                  title: "Modul Fasilitas",
                  color: "bg-cyan-400",
                  desc: "Optimalisasi sumber daya belajar digital untuk efisiensi pemahaman materi...",
                },
                {
                  id: 6,
                  title: "Modul Solusi",
                  color: "bg-orange-600",
                  desc: "Langkah-langkah taktis dalam menyelesaikan masalah dan komplain secara profesional...",
                },
                {
                  id: 7,
                  title: "Modul Manajemen",
                  color: "bg-red-600",
                  desc: "Tata kelola kepemimpinan yang esensial bagi pengembangan organisasi...",
                },
                {
                  id: 8,
                  title: "Modul Mastery",
                  color: "bg-amber-500",
                  desc: "Tahap akhir penguasaan materi dengan solusi komprehensif berbasis data...",
                },
              ].map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 ${lesson.color} text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg mb-4 sm:mb-6 shadow-lg`}
                  >
                    {lesson.id}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">
                    {lesson.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 line-clamp-3 italic">
                    {lesson.desc}
                  </p>

                  <Button
                    variant="outline"
                    className="mt-auto border-purple-100 text-purple-500 rounded-xl px-6 sm:px-8 hover:bg-purple-500 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    Buka Modul
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12 sm:mt-16">
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 sm:px-10 h-12 sm:h-14 rounded-2xl font-bold text-sm sm:text-lg shadow-xl shadow-purple-100">
                Lihat Seluruh Katalog
              </Button>
            </div>
          </div>
        </section>

        {/* --- COLLEGE LEVEL SECTION (CTA) --- */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto bg-[#F8F8FF] rounded-[2rem] sm:rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-center p-6 sm:p-10 md:p-16 gap-8 sm:gap-12 relative">
            <div className="absolute right-[20%] top-10 w-32 h-32 grid grid-cols-8 gap-2 opacity-30 hidden md:grid">
              {[...Array(64)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-purple-600 rounded-full" />
              ))}
            </div>

            <div className="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
              <div className="inline-block">
                <span className="bg-purple-100 text-[#8B5CF6] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold">
                  Akademik & Karir
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Jangan biarkan waktu <br className="hidden sm:inline" />
                terbuang sia-sia. Ayo <br />
                bangun portofolio Anda.
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-md mx-auto lg:mx-0 leading-relaxed">
                Dunia bergerak cepat, pastikan keahlian Anda tetap relevan.
                Dapatkan akses ke materi tingkat lanjut yang akan membantu Anda
                bersaing di industri global.
              </p>

              <Button className="bg-[#A855F7] hover:bg-[#9333EA] text-white px-8 sm:px-10 h-12 sm:h-14 rounded-2xl font-bold text-sm sm:text-lg shadow-xl shadow-purple-100 transition-all">
                Gabung Sekarang
              </Button>
            </div>

            <div className="flex-1 relative flex justify-center items-center w-full max-w-xs sm:max-w-md mx-auto">
              <div className="relative w-full aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1523240715630-341646700078?q=80&w=2070"
                  alt="Talent"
                  className="w-full h-full object-contain relative z-10"
                />

                <div className="absolute top-1/4 -left-4 sm:-left-8 bg-white p-2 sm:p-3 rounded-xl shadow-xl z-20 animate-bounce">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-orange-500 bg-orange-50 rounded-lg text-xs sm:text-sm">
                    🚀
                  </div>
                </div>

                <div className="absolute top-10 -right-2 sm:-right-4 bg-white p-2 sm:p-3 rounded-xl shadow-xl z-20">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-red-500 bg-red-50 rounded-lg text-xs sm:text-sm">
                    ⭐
                  </div>
                </div>

                <div className="absolute bottom-1/3 -right-4 sm:-right-10 bg-white p-2 sm:p-3 rounded-xl shadow-xl z-20 animate-pulse">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-lg font-black text-[10px] sm:text-xs">
                    GO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- MENTOR SECTION --- */}
        <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white">
          <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 w-full max-w-xs sm:max-w-md mx-auto relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-gradient-to-tr from-orange-100 to-transparent rounded-full opacity-50 blur-3xl" />

              <div className="relative w-full aspect-square overflow-hidden rounded-full border-8 sm:border-[16px] border-white shadow-2xl shadow-orange-100">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974"
                  alt="Expert Mentor"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Punya keahlian menarik? <br className="hidden sm:inline" /> Mari menginspirasi <br /> bersama kami
              </h2>

              <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                Tinggalkan jejak bermanfaat dengan menjadi bagian dari tim
                pengajar kami. Bantu jutaan orang menemukan potensi mereka dan
                bangun reputasi Anda sebagai ahli di bidangnya.
              </p>

              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 sm:px-10 h-12 sm:h-14 rounded-2xl font-bold text-sm sm:text-lg shadow-xl shadow-purple-100 transition-all">
                Daftar Sebagai Mentor
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
