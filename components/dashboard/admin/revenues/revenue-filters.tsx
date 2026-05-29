"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RevenueFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");
  const [isExporting, setIsExporting] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (start) params.set("start", start);
    else params.delete("start");
    if (end) params.set("end", end);
    else params.delete("end");
    
    // Reset to page 1 when filtering
    params.delete("page");
    
    router.push(`?${params.toString()}`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    let url = "/api/admin/revenues/export";
    const params = new URLSearchParams();
    if (start) params.set("startDate", start);
    if (end) params.set("endDate", end);
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    
    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }
    
    // Trigger download via anchor
    const link = document.createElement("a");
    link.href = url;
    link.download = "Laporan.xlsx";
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
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);
      const search = searchParams.get("search");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/revenues/export?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");
      const json = await res.json();
      const rows = json.data;

      const headers = [
        "No",
        "Tanggal Transaksi",
        "No. Invoice",
        "Siswa (Pembeli)",
        "Email Siswa",
        "Nama Kursus",
        "Instruktur",
        "Nominal Pendapatan (IDR)",
      ];

      const csvRows = rows.map((row: any, idx: number) => [
        idx + 1,
        new Date(row.createdDate).toLocaleString("id-ID"),
        row.invoiceNumber,
        row.student.name,
        row.student.email,
        row.course?.title ?? "-",
        row.course?.instructor ?? "-",
        row.totalAmount,
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
      const periodLabel = start && end ? `${start}_to_${end}` : "all-time";
      link.href = downloadUrl;
      link.download = `revenue_${periodLabel}_${timestamp}.csv`;
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
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);
      const search = searchParams.get("search");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/revenues/export?${params.toString()}`);
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
      doc.setTextColor(45, 45, 45); // #2D2D2D
      doc.text("LAPORAN KEUANGAN TRANSAKSI KURSUS", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      const search = searchParams.get("search");
      const periodLabel = start && end ? `${start} s/d ${end}` : "Semua Waktu";
      const searchLabel = search?.trim() ? search : "-";
      doc.text(`Periode: ${periodLabel}  |  Kata Kunci: ${searchLabel}`, 14, 21);
      doc.text(`Waktu Unduh: ${new Date().toLocaleString("id-ID")}`, 14, 26);
      doc.text(`Jumlah Transaksi: ${rows.length}`, 14, 31);

      // Garis pemisah
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 35, 283, 35);

      // ── Table Data ────────────────────────────────────────────────────────────
      const tableHeaders = [
        "No",
        "Tanggal Transaksi",
        "No. Invoice",
        "Siswa (Pembeli)",
        "Nama Kursus",
        "Instruktur",
        "Nominal Pendapatan",
      ];

      const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const tableRows = rows.map((row: any, idx: number) => [
        idx + 1,
        new Date(row.createdDate).toLocaleString("id-ID"),
        row.invoiceNumber,
        row.student.name,
        row.course?.title ?? "-",
        row.course?.instructor ?? "-",
        formatIDR(row.totalAmount),
      ]);

      // Calculate total
      const totalRevenue = rows.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
      tableRows.push([
        "", "", "", "", "", "TOTAL PENDAPATAN:", formatIDR(totalRevenue)
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 40,
        theme: "striped",
        headStyles: {
          fillColor: [249, 115, 22], // Orange-500
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
        didParseCell: (data) => {
          // Bold the total row
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            if (data.column.index >= 5) {
              data.cell.styles.fillColor = [255, 237, 213]; // Orange-50
            }
          }
        },
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
      const filePeriod = start && end ? `${start}_to_${end}` : "semua";
      doc.save(`revenue_${filePeriod}_${timestamp}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengekspor data ke PDF. Silakan coba lagi.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between w-full gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-[1.25rem] shadow-sm border border-slate-100 w-full lg:w-auto">
        <div className="flex flex-col px-3 py-1 w-full sm:w-auto">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dari Tanggal</label>
          <input 
            type="date" 
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="text-sm font-bold text-slate-700 outline-none bg-transparent"
          />
        </div>
        <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
        <div className="flex flex-col px-3 py-1 w-full sm:w-auto">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sampai Tanggal</label>
          <input 
            type="date" 
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="text-sm font-bold text-slate-700 outline-none bg-transparent"
          />
        </div>
        <Button 
          onClick={handleFilter}
          className="w-full sm:w-auto rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 h-11"
        >
          Filter
        </Button>
      </div>
      
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
