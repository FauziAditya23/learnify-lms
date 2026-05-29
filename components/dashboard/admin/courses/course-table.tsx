"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Course {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  category: string;
  level: string;
  instructor: string;
  instructorEmail: string;
  price: number;
  status: number;
  isPublished: boolean;
  totalLessons: number;
  totalEnrollments: number;
  date: string;
}

interface CourseTableProps {
  courses: Course[];
  page: number;
  totalPages: number;
  totalCourses: number;
}

export default function CourseTable({ courses, page, totalPages, totalCourses }: CourseTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputVal, setInputVal] = React.useState(searchParams.get("search") || "");

  const triggerSearch = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set("search", val.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      triggerSearch(inputVal);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const fmtIDR = (n: number) => {
    if (n === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  const getStatusBadge = (status: number, isPublished: boolean) => {
    if (status === 2) {
      return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Menunggu</span>;
    }
    if (status === 3) {
      return <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Ditolak</span>;
    }
    if (isPublished) {
      return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Publis</span>;
    }
    return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Draft</span>;
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-black text-[#2D2D2D] text-lg">Daftar Kursus</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Total {totalCourses} kursus ditemukan</p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari kursus, instruktur..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all text-xs font-medium"
          />
          {inputVal && (
            <button 
              onClick={() => { setInputVal(""); triggerSearch(""); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left pb-4 pl-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kursus</th>
              <th className="text-left pb-4 pl-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Instruktur</th>
              <th className="text-left pb-4 pl-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kategori & Harga</th>
              <th className="text-left pb-4 pl-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 font-medium">
                  Belum ada kursus yang ditemukan.
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen size={16} />
                          </div>
                        )}
                      </div>
                      <div className="max-w-[250px]">
                        <p className="font-bold text-[#2D2D2D] truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{c.date} • {c.totalLessons} materi</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pl-4">
                    <p className="font-bold text-slate-700">{c.instructor}</p>
                    <p className="text-[10px] text-slate-400">{c.instructorEmail}</p>
                  </td>
                  <td className="py-4 pl-4">
                    <p className="text-xs font-black text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md mb-1">{c.category}</p>
                    <p className="text-xs font-bold text-slate-600">{fmtIDR(c.price)}</p>
                  </td>
                  <td className="py-4 pl-4">
                    {getStatusBadge(c.status, c.isPublished)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="w-10 h-10 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
