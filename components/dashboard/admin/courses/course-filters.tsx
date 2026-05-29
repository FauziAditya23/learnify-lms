"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CourseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isExporting, setIsExporting] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    let url = "/api/admin/courses/export";
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    
    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }
    
    // Trigger download via anchor
    const link = document.createElement("a");
    link.href = url;
    link.download = "Laporan_Kursus.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const params = new URLSearchParams({ format: "json" });
      const search = searchParams.get("search");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/courses/export?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");
      const json = await res.json();
      const rows = json.data;

      const headers = [
        "No",
        "Tanggal Dibuat",
        "Judul Kursus",
        "Kategori",
        "Instruktur",
        "Level",
        "Harga (IDR)",
        "Status",
      ];

      const getStatusLabel = (status: number, isPublished: boolean) => {
        if (status === 2) return "Menunggu Persetujuan";
        if (status === 3) return "Ditolak";
        if (isPublished) return "Dipublikasi";
        return "Draft";
      };

      const csvRows = rows.map((row: any, idx: number) => [
        idx + 1,
        new Date(row.createdDate).toLocaleString("id-ID"),
        row.title,
        row.category.name,
        row.instructor.name,
        row.level,
        row.price,
        getStatusLabel(row.status, row.isPublished),
      ]);

      const escape = (v: unknown) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csvContent =
        "\uFEFF" + // BOM for Excel UTF-8
        [headers, ...csvRows].map((r: any) => r.map(escape).join(",")).join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = downloadUrl;
      link.download = `courses_${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export CSV error:", err);
      alert("Gagal mengekspor data ke CSV. Silakan coba lagi.");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams({ format: "json" });
      const search = searchParams.get("search");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/courses/export?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");
      const json = await res.json();
      const rows = json.data;

      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // ── Header Laporan ──────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(45, 45, 45);
      doc.text("LAPORAN DATA KURSUS", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      const searchLabel = search?.trim() ? search : "-";
      doc.text(`Kata Kunci: ${searchLabel}`, 14, 21);
      doc.text(`Waktu Unduh: ${new Date().toLocaleString("id-ID")}`, 14, 26);
      doc.text(`Jumlah Kursus: ${rows.length}`, 14, 31);

      // Garis pemisah
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 35, 283, 35);

      // ── Table Data ────────────────────────────────────────────────────────────
      const tableHeaders = [
        "No",
        "Tanggal Dibuat",
        "Judul Kursus",
        "Kategori",
        "Instruktur",
        "Level",
        "Harga",
        "Status",
      ];

      const formatIDR = (amount: number) => {
        if (amount === 0) return "GRATIS";
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const getStatusLabel = (status: number, isPublished: boolean) => {
        if (status === 2) return "Menunggu";
        if (status === 3) return "Ditolak";
        if (isPublished) return "Publis";
        return "Draft";
      };

      const tableRows = rows.map((row: any, idx: number) => [
        idx + 1,
        new Date(row.createdDate).toLocaleDateString("id-ID"),
        row.title,
        row.category.name,
        row.instructor.name,
        row.level,
        formatIDR(Number(row.price)),
        getStatusLabel(row.status, row.isPublished),
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 40,
        theme: "striped",
        headStyles: {
          fillColor: [59, 130, 246], // Blue-500
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { top: 40, left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`courses_${timestamp}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengekspor data ke PDF. Silakan coba lagi.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between w-full gap-4">
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
        <Button 
          onClick={handleExport}
          disabled={isExporting || csvLoading || pdfLoading}
          className="h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] flex items-center gap-2 font-bold text-sm transition-colors shadow-md disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
          {isExporting ? "Excel..." : "Excel (.xlsx)"}
        </Button>

        <Button 
          onClick={handleExportCSV}
          disabled={isExporting || csvLoading || pdfLoading}
          className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] flex items-center gap-2 font-bold text-sm transition-colors shadow-md disabled:opacity-50"
        >
          {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
          {csvLoading ? "CSV..." : "CSV"}
        </Button>

        <Button 
          onClick={handleExportPDF}
          disabled={isExporting || csvLoading || pdfLoading}
          className="h-12 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.25rem] flex items-center gap-2 font-bold text-sm transition-colors shadow-md disabled:opacity-50"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
          {pdfLoading ? "PDF..." : "PDF"}
        </Button>
      </div>
    </div>
  );
}
