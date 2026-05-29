"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Receipt,
  User,
  BookOpen,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Filter,
  Eye,
  Edit3,
  CalendarDays,
  Tag,
  Banknote,
  X,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface CourseInfo {
  id: number;
  title: string;
  thumbnail: string | null;
  category: string;
}

interface LatestTransaction {
  orderId: string;
  grossAmount: number;
  transactionStatus: string;
  paymentType: string;
  transactionTime: string;
}

interface PaymentRow {
  id: number;
  invoiceNumber: string;
  invoiceStatus: string;
  totalAmount: number;
  discountAmt: number;
  dueDate: string;
  createdDate: string;
  couponCode: string | null;
  discountPercent: number | null;
  student: StudentInfo;
  course: CourseInfo | null;
  latestTransaction: LatestTransaction | null;
}

interface StatItem {
  status: string;
  count: number;
  totalAmount: number;
}

interface PaymentTableProps {
  initialData: PaymentRow[];
  initialStats: StatItem[];
  initialTotal: number;
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
    icon: <Clock size={12} />,
  },
  paid: {
    label: "Lunas",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-400",
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: "Gagal",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-400",
    icon: <XCircle size={12} />,
  },
  expired: {
    label: "Kedaluwarsa",
    color: "text-slate-500",
    bg: "bg-slate-100 border-slate-200",
    dot: "bg-slate-400",
    icon: <AlertCircle size={12} />,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200",
    dot: "bg-rose-400",
    icon: <X size={12} />,
  },
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  bank_transfer: "Transfer Bank",
  credit_card: "Kartu Kredit",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  qris: "QRIS",
  cstore: "Minimarket",
  echannel: "Mandiri",
  bca_klikbca: "BCA KlikBCA",
  bca_klikpay: "BCA KlikPay",
  mandiri_clickpay: "Mandiri ClickPay",
  permata: "Permata",
  other: "Lainnya",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-slate-500",
    bg: "bg-slate-100 border-slate-200",
    dot: "bg-slate-400",
    icon: <AlertCircle size={12} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  row,
  onClose,
  onStatusChange,
}: {
  row: PaymentRow;
  onClose: () => void;
  onStatusChange: (id: number, newStatus: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(row.invoiceStatus);

  const handleUpdate = async () => {
    if (selectedStatus === row.invoiceStatus) return;
    setUpdating(true);
    await onStatusChange(row.id, selectedStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Detail Pembayaran"
      description={`Invoice ${row.invoiceNumber}`}
    >
      <div className="space-y-5">
        {/* Student */}
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 text-sm shrink-0">
            {row.student.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-sm truncate">{row.student.name}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate">{row.student.email}</p>
          </div>
          <StatusBadge status={row.invoiceStatus} />
        </div>

        {/* Course */}
        {row.course && (
          <div className="flex items-start gap-3 bg-orange-50/60 rounded-2xl p-4 border border-orange-100">
            <BookOpen size={16} className="text-orange-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-0.5">Kursus</p>
              <p className="font-black text-slate-800 text-sm leading-snug">{row.course.title}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{row.course.category}</p>
            </div>
          </div>
        )}

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Tagihan</p>
            <p className="font-black text-slate-800 text-sm">{formatIDR(row.totalAmount)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Diskon</p>
            <p className="font-black text-emerald-600 text-sm">
              {row.discountAmt > 0 ? `-${formatIDR(row.discountAmt)}` : "-"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Jatuh Tempo</p>
            <p className="font-black text-slate-800 text-xs">{formatDate(row.dueDate)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Dibuat</p>
            <p className="font-black text-slate-800 text-xs">{formatDate(row.createdDate)}</p>
          </div>
        </div>

        {/* Coupon */}
        {row.couponCode && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
            <Tag size={14} className="text-purple-400" />
            <span className="text-xs font-black text-purple-600">{row.couponCode}</span>
            <span className="text-[10px] text-purple-400 font-medium ml-auto">
              -{row.discountPercent}%
            </span>
          </div>
        )}

        {/* Transaction */}
        {row.latestTransaction && (
          <div className="border border-slate-100 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard size={12} /> Transaksi Terakhir
            </p>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Order ID</span>
              <span className="text-[11px] font-black text-slate-700 font-mono">{row.latestTransaction.orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Metode</span>
              <span className="text-[11px] font-black text-slate-700">
                {PAYMENT_TYPE_LABEL[row.latestTransaction.paymentType] ?? row.latestTransaction.paymentType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Jumlah</span>
              <span className="text-[11px] font-black text-slate-700">
                {formatIDR(row.latestTransaction.grossAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Status Transaksi</span>
              <StatusBadge status={row.latestTransaction.transactionStatus} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Waktu</span>
              <span className="text-[11px] font-black text-slate-700">
                {formatDate(row.latestTransaction.transactionTime)}
              </span>
            </div>
          </div>
        )}

        {/* Manual Status Update */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-black text-slate-600 mb-2 flex items-center gap-1.5">
            <Edit3 size={12} /> Ubah Status Invoice (Manual)
          </p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all"
          >
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 font-bold">
              Batal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating || selectedStatus === row.invoiceStatus}
              className="flex-1 h-11 bg-[#FF6B4A] hover:bg-[#E55A3B] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {updating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PaymentTable({
  initialData,
  initialStats,
  initialTotal,
}: PaymentTableProps) {
  const [data, setData] = useState<PaymentRow[]>(initialData);
  const [stats, setStats] = useState<StatItem[]>(initialStats);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PaymentRow | null>(null);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setStats(json.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const res = await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: id, newStatus }),
    });
    if (res.ok) {
      await fetchData();
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/payments/export?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");
      const json = await res.json();
      const rows: PaymentRow[] = json.data;

      const PAYMENT_TYPE_CSV: Record<string, string> = {
        bank_transfer: "Transfer Bank",
        credit_card: "Kartu Kredit",
        gopay: "GoPay",
        shopeepay: "ShopeePay",
        qris: "QRIS",
        cstore: "Minimarket",
        echannel: "Mandiri",
        bca_klikbca: "BCA KlikBCA",
        bca_klikpay: "BCA KlikPay",
        mandiri_clickpay: "Mandiri ClickPay",
        permata: "Permata",
        other: "Lainnya",
      };

      const STATUS_LABEL_CSV: Record<string, string> = {
        pending: "Pending",
        paid: "Lunas",
        failed: "Gagal",
        expired: "Kedaluwarsa",
        cancelled: "Dibatalkan",
      };

      const headers = [
        "No",
        "No Invoice",
        "Nama Student",
        "Email Student",
        "Nama Kursus",
        "Kategori",
        "Total Tagihan (IDR)",
        "Diskon (IDR)",
        "Kode Kupon",
        "Diskon (%)",
        "Status Invoice",
        "Metode Pembayaran",
        "Status Transaksi",
        "Tgl Dibuat",
        "Jatuh Tempo",
      ];

      const csvRows = rows.map((row, idx) => [
        idx + 1,
        row.invoiceNumber,
        row.student.name,
        row.student.email,
        row.course?.title ?? "-",
        row.course?.category ?? "-",
        row.totalAmount,
        row.discountAmt,
        row.couponCode ?? "-",
        row.discountPercent ?? "-",
        STATUS_LABEL_CSV[row.invoiceStatus] ?? row.invoiceStatus,
        row.latestTransaction
          ? (PAYMENT_TYPE_CSV[row.latestTransaction.paymentType] ?? row.latestTransaction.paymentType)
          : "-",
        row.latestTransaction
          ? (STATUS_LABEL_CSV[row.latestTransaction.transactionStatus] ?? row.latestTransaction.transactionStatus)
          : "-",
        new Date(row.createdDate).toLocaleString("id-ID"),
        new Date(row.dueDate).toLocaleString("id-ID"),
      ]);

      const escape = (v: unknown) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csvContent =
        "\uFEFF" + // BOM for Excel UTF-8
        [headers, ...csvRows].map((r) => r.map(escape).join(",")).join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      const filterLabel = statusFilter === "all" ? "semua" : statusFilter;
      link.href = url;
      link.download = `payment-status_${filterLabel}_${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/payments/export?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data untuk export");
      const json = await res.json();
      const rows: PaymentRow[] = json.data;

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
      doc.text("LAPORAN STATUS PEMBAYARAN", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      const filterLabel = statusFilter === "all" ? "Semua Status" : STATUS_CONFIG[statusFilter]?.label ?? statusFilter;
      const searchLabel = search.trim() ? search : "-";
      doc.text(`Filter Status: ${filterLabel}  |  Kata Kunci: ${searchLabel}`, 14, 21);
      doc.text(`Waktu Unduh: ${new Date().toLocaleString("id-ID")}`, 14, 26);
      doc.text(`Jumlah Baris: ${rows.length}`, 14, 31);

      // Garis pemisah
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 35, 283, 35);

      // ── Table Data ────────────────────────────────────────────────────────────
      const STATUS_LABEL_PDF: Record<string, string> = {
        pending: "Pending",
        paid: "Lunas",
        failed: "Gagal",
        expired: "Kedaluwarsa",
        cancelled: "Dibatalkan",
      };

      const tableHeaders = [
        "No",
        "No Invoice",
        "Student",
        "Email",
        "Kursus",
        "Total (IDR)",
        "Diskon (IDR)",
        "Metode",
        "Status",
        "Tanggal",
      ];

      const tableRows = rows.map((row, idx) => [
        idx + 1,
        row.invoiceNumber,
        row.student.name,
        row.student.email,
        row.course?.title ?? "-",
        formatIDR(row.totalAmount),
        row.discountAmt > 0 ? formatIDR(row.discountAmt) : "-",
        row.latestTransaction
          ? (PAYMENT_TYPE_LABEL[row.latestTransaction.paymentType] ?? row.latestTransaction.paymentType)
          : "-",
        STATUS_LABEL_PDF[row.invoiceStatus] ?? row.invoiceStatus,
        formatDate(row.createdDate),
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 40,
        theme: "striped",
        headStyles: {
          fillColor: [255, 107, 74], // Learnify orange color: #FF6B4A
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
      const fileFilter = statusFilter === "all" ? "semua" : statusFilter;
      doc.save(`payment-status_${fileFilter}_${timestamp}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengekspor data ke PDF. Silakan coba lagi.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Summary stat totals
  const totalPaid = stats.find((s) => s.status === "paid")?.totalAmount ?? 0;
  const totalPending = stats.find((s) => s.status === "pending")?.count ?? 0;
  const countPaid = stats.find((s) => s.status === "paid")?.count ?? 0;
  const countFailed =
    (stats.find((s) => s.status === "failed")?.count ?? 0) +
    (stats.find((s) => s.status === "expired")?.count ?? 0);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={formatIDR(totalPaid)}
          sub="dari invoice lunas"
          color="text-emerald-600"
          bg="bg-emerald-50"
          icon={<Banknote size={20} />}
        />
        <SummaryCard
          label="Invoice Lunas"
          value={countPaid.toLocaleString("id-ID")}
          sub="transaksi berhasil"
          color="text-blue-600"
          bg="bg-blue-50"
          icon={<CheckCircle2 size={20} />}
        />
        <SummaryCard
          label="Menunggu Bayar"
          value={totalPending.toLocaleString("id-ID")}
          sub="perlu tindakan"
          color="text-amber-600"
          bg="bg-amber-50"
          icon={<Clock size={20} />}
        />
        <SummaryCard
          label="Gagal / Expired"
          value={countFailed.toLocaleString("id-ID")}
          sub="tidak berhasil"
          color="text-red-600"
          bg="bg-red-50"
          icon={<XCircle size={20} />}
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama, email, invoice, kursus..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all text-sm font-medium w-full sm:w-80"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#FF6B4A] text-sm font-bold text-slate-600 appearance-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions: Refresh + Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 text-sm font-bold transition-all"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exportLoading || pdfLoading || loading}
              title="Export data sesuai filter aktif ke CSV"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {exportLoading ? "Mengekspor..." : "Export CSV"}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exportLoading || pdfLoading || loading}
              title="Export data sesuai filter aktif ke PDF"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {pdfLoading ? "Mengekspor..." : "Export PDF"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kursus</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2 size={28} className="animate-spin text-orange-400 mx-auto" />
                    <p className="text-slate-400 text-sm font-medium mt-3">Memuat data...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Receipt size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Tidak ada data pembayaran ditemukan</p>
                    <p className="text-slate-300 text-xs mt-1">Coba ubah filter atau kata kunci pencarian</p>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50/30 transition-colors group"
                  >
                    {/* Invoice */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-[11px] font-mono">
                          {row.invoiceNumber}
                        </span>
                        {row.couponCode && (
                          <span className="text-[9px] text-purple-500 font-bold flex items-center gap-0.5 mt-0.5">
                            <Tag size={9} /> {row.couponCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 text-[10px] shrink-0">
                          {row.student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-[11px] truncate max-w-[140px]">
                            {row.student.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium truncate max-w-[140px]">
                            {row.student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4">
                      {row.course ? (
                        <div className="min-w-0">
                          <p className="font-black text-slate-700 text-[11px] truncate max-w-[160px]">
                            {row.course.title}
                          </p>
                          <span className="text-[9px] font-black text-[#FF6B4A] bg-orange-50 px-1.5 py-0.5 rounded-md">
                            {row.course.category}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-800 text-xs">
                        {formatIDR(row.totalAmount)}
                      </span>
                      {row.discountAmt > 0 && (
                        <p className="text-[9px] text-emerald-500 font-bold">
                          -{formatIDR(row.discountAmt)}
                        </p>
                      )}
                    </td>

                    {/* Metode */}
                    <td className="py-3.5 px-4">
                      {row.latestTransaction ? (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {PAYMENT_TYPE_LABEL[row.latestTransaction.paymentType] ??
                            row.latestTransaction.paymentType}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium">Belum bayar</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={row.invoiceStatus} />
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <CalendarDays size={10} />
                        {formatDate(row.createdDate)}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedRow(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 transition-all"
                      >
                        <Eye size={11} />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              Halaman <span className="font-black text-slate-700">{page}</span> dari{" "}
              <span className="font-black text-slate-700">{totalPages}</span> · Total{" "}
              <span className="font-black text-slate-700">{total}</span> invoice
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                      p === page
                        ? "bg-[#FF6B4A] text-white shadow-md shadow-orange-200"
                        : "border border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-500"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRow && (
        <DetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  color,
  bg,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-orange-50 shadow-sm p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <p className="font-black text-slate-800 text-lg leading-tight truncate">{value}</p>
        <p className="text-[9px] text-slate-400 font-medium">{sub}</p>
      </div>
    </div>
  );
}
