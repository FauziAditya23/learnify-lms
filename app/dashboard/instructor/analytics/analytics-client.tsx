"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Loader2, TrendingUp, Users, DollarSign, BookOpen, Download, FileText } from "lucide-react";
import ExcelJS from "exceljs";

interface AnalyticsData {
  revenueData: { name: string, revenue: number }[];
  enrollmentsData: { name: string, enrollments: number }[];
  coursePopularity: { name: string, students: number }[];
  totalRevenue: number;
  totalEnrollments: number;
}

const COLORS = ["#FF6B4A", "#4A90E2", "#50E3C2", "#F5A623", "#BD10E0"];

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/instructor/analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportToExcel = async () => {
    if (!data) return;
    setIsExporting(true);
    
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Instructor Analytics");

      // Header style
      sheet.addRow(["Instructor Performance Report"]);
      sheet.getRow(1).font = { bold: true, size: 16 };
      sheet.addRow([]);

      // Statistics Section
      sheet.addRow(["Overview Statistics"]);
      sheet.getRow(3).font = { bold: true };
      sheet.addRow(["Metric", "Value"]);
      sheet.addRow(["Total Revenue", data.totalRevenue]);
      sheet.addRow(["Total Students", data.totalEnrollments]);
      sheet.addRow(["Total Courses", data.coursePopularity.length]);
      sheet.addRow([]);

      // Revenue Section
      sheet.addRow(["Monthly Revenue Trend"]);
      sheet.getRow(10).font = { bold: true };
      sheet.addRow(["Month", "Revenue (IDR)"]);
      data.revenueData.forEach(row => sheet.addRow([row.name, row.revenue]));
      sheet.addRow([]);

      // Enrollments Section
      sheet.addRow([`Enrollment Activity`]);
      const lastRow = sheet.rowCount;
      sheet.getRow(lastRow).font = { bold: true };
      sheet.addRow(["Month", "Students"]);
      data.enrollmentsData.forEach(row => sheet.addRow([row.name, row.enrollments]));

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Learnify_Analytics_${new Date().toLocaleDateString()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    setCsvLoading(true);
    try {
      const csvRows = [];
      
      // Title
      csvRows.push(["Instructor Performance Report"]);
      csvRows.push([]);

      // Statistics Section
      csvRows.push(["Overview Statistics"]);
      csvRows.push(["Metric", "Value"]);
      csvRows.push(["Total Revenue", data.totalRevenue]);
      csvRows.push(["Total Students", data.totalEnrollments]);
      csvRows.push(["Total Courses", data.coursePopularity.length]);
      csvRows.push([]);

      // Revenue Section
      csvRows.push(["Monthly Revenue Trend"]);
      csvRows.push(["Month", "Revenue (IDR)"]);
      data.revenueData.forEach(row => csvRows.push([row.name, row.revenue]));
      csvRows.push([]);

      // Enrollments Section
      csvRows.push(["Enrollment Activity"]);
      csvRows.push(["Month", "Students"]);
      data.enrollmentsData.forEach(row => csvRows.push([row.name, row.enrollments]));

      const escape = (v: unknown) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csvContent =
        "\uFEFF" + // BOM for Excel UTF-8
        csvRows.map((r) => r.map(escape).join(",")).join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Learnify_Analytics_${new Date().toLocaleDateString("id-ID")}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export error:", error);
    } finally {
      setCsvLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // ── Header Laporan ──────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(45, 45, 45); // #2D2D2D
      doc.text("INSTRUCTOR PERFORMANCE REPORT", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Waktu Unduh: ${new Date().toLocaleString("id-ID")}`, 14, 21);

      // Garis pemisah
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 25, 196, 25);

      // ── Overview Statistics ───────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(45, 45, 45);
      doc.text("Overview Statistics", 14, 33);

      const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const statsHeaders = ["Metric", "Value"];
      const statsRows = [
        ["Total Revenue", formatIDR(data.totalRevenue)],
        ["Total Students", data.totalEnrollments.toLocaleString("id-ID")],
        ["Total Courses", data.coursePopularity.length.toString()],
      ];

      autoTable(doc, {
        head: [statsHeaders],
        body: statsRows,
        startY: 37,
        theme: "striped",
        headStyles: { fillColor: [74, 144, 226], fontStyle: "bold" }, // Blue
        margin: { left: 14, right: 14 },
      });

      // ── Monthly Revenue Trend ─────────────────────────────────────────────────
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Monthly Revenue Trend", 14, finalY);

      const revenueHeaders = ["Month", "Revenue"];
      const revenueRows = data.revenueData.map(row => [row.name, formatIDR(row.revenue)]);

      autoTable(doc, {
        head: [revenueHeaders],
        body: revenueRows,
        startY: finalY + 4,
        theme: "striped",
        headStyles: { fillColor: [255, 107, 74], fontStyle: "bold" }, // Orange: #FF6B4A
        margin: { left: 14, right: 14 },
      });

      // ── Enrollment Activity ──────────────────────────────────────────────────
      finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Enrollment Activity", 14, finalY);

      const enrollHeaders = ["Month", "Students"];
      const enrollRows = data.enrollmentsData.map(row => [row.name, row.enrollments.toLocaleString("id-ID")]);

      autoTable(doc, {
        head: [enrollHeaders],
        body: enrollRows,
        startY: finalY + 4,
        theme: "striped",
        headStyles: { fillColor: [80, 227, 194], fontStyle: "bold", textColor: [45, 45, 45] }, // Tealish
        margin: { left: 14, right: 14 },
        didDrawPage: (pageData) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Halaman ${pageData.pageNumber} dari ${pageCount}`,
            pageData.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      doc.save(`Learnify_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Gagal mengekspor data ke PDF. Silakan coba lagi.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#FF6B4A]" size={40} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `Rp ${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Students", value: data.totalEnrollments.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Courses", value: data.coursePopularity.length.toString(), icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Growth Rate", value: "+12.5%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-xl font-black text-slate-800">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#FF6B4A]" />
              Revenue Trends
            </h3>
            <button className="text-[11px] font-black text-[#FF6B4A] uppercase tracking-widest hover:underline">Last 6 Months</button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#FF6B4A' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF6B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Enrollments */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Enrollment Activity
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.enrollmentsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="enrollments" fill="#4A90E2" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Top Courses */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm">
            <h3 className="font-black text-slate-800 mb-8">Popularity by Course</h3>
            <div className="space-y-6">
               {data.coursePopularity.map((course, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-bold text-slate-700">{course.name}</span>
                      <span className="text-xs font-black text-slate-400">{course.students} Students</span>
                   </div>
                   <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${(course.students / data.totalEnrollments) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }} 
                      />
                   </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Pie Chart / Distribution placeholder */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-orange-100 text-[#FF6B4A] rounded-2xl flex items-center justify-center mb-6">
               {isExporting ? <Loader2 size={32} className="animate-spin" /> : <Download size={32} />}
            </div>
            <h3 className="font-black text-slate-800 mb-2">Detailed Reports</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
               Download your full performance report including student data and financial statements.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={exportToExcel}
                disabled={isExporting || csvLoading || pdfLoading}
                className="w-full h-12 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? "Exporting Excel..." : "Export to Excel (.xlsx)"}
              </button>

              <button 
                onClick={exportToCSV}
                disabled={isExporting || csvLoading || pdfLoading}
                className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {csvLoading ? "Exporting CSV..." : "Export to CSV"}
              </button>

              <button 
                onClick={exportToPDF}
                disabled={isExporting || csvLoading || pdfLoading}
                className="w-full h-12 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {pdfLoading ? "Exporting PDF..." : "Export to PDF"}
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
