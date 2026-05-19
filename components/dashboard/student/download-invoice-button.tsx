"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface InvoiceData {
  invoiceNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  amount: number;
  date: string;
  status: string;
}

export default function DownloadInvoiceButton({ invoice }: { invoice: InvoiceData }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

      // Colors Config
      const primaryColor = [30, 27, 75]; // #1E1B4B (Deep Purple/Navy)
      const accentColor = [255, 107, 74]; // #FF6B4A (Orange Accent)
      const textColorDark = [15, 23, 42]; // #0F172A (Slate 900)
      const textColorLight = [100, 116, 139]; // #64748B (Slate 500)
      const dividerColor = [226, 232, 240]; // #E2E8F0 (Slate 200)

      // ─── 1. BRANDING & HEADER ──────────────────────────────────────────────
      // Logo text
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("Learnify.", 20, 28);

      // Dot Accent
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.circle(63, 20.5, 1.8, "F");

      // Right Header - Status Badge
      const isPaid = invoice.status.toLowerCase() === "lunas" || invoice.status.toLowerCase() === "paid";
      
      if (isPaid) {
        // Soft Green Badge for Lunas
        doc.setFillColor(240, 253, 244); // #F0FDF4
        doc.roundedRect(pageWidth - 55, 18, 35, 10, 2, 2, "F");
        
        doc.setDrawColor(187, 247, 208); // #BBF7D8
        doc.roundedRect(pageWidth - 55, 18, 35, 10, 2, 2, "S");

        doc.setTextColor(21, 128, 61); // #15803D (Green 700)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("PAID / LUNAS", pageWidth - 37.5, 24.5, { align: "center" });
      } else {
        // Soft Orange Badge for Pending
        doc.setFillColor(255, 247, 237); // #FFF7ED
        doc.roundedRect(pageWidth - 55, 18, 35, 10, 2, 2, "F");

        doc.setDrawColor(254, 215, 170); // #FED7AA
        doc.roundedRect(pageWidth - 55, 18, 35, 10, 2, 2, "S");

        doc.setTextColor(194, 65, 12); // #C2410C (Orange 700)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("PENDING", pageWidth - 37.5, 24.5, { align: "center" });
      }

      // Elegant divider below header
      doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
      doc.setLineWidth(0.4);
      doc.line(20, 36, pageWidth - 20, 36);

      // ─── 2. INVOICE META DATA (TWO-COLUMN LAYOUT) ──────────────────────────
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("KWITANSI PEMBAYARAN", 20, 48);

      // Column 1: Invoice Details
      doc.setFontSize(8.5);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("NOMOR TAGIHAN", 20, 58);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.invoiceNumber, 20, 63);

      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("TANGGAL TRANSAKSI", 20, 72);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.date, 20, 77);

      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("METODE PEMBAYARAN", 20, 86);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text("Gateway Midtrans (Otomatis)", 20, 91);

      // Column 2: Customer Details
      const col2Left = pageWidth / 2 + 10;
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("DIBAYARKAN KEPADA", col2Left, 58);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text("Learnify LMS Platform", col2Left, 63);

      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("DIBAYARKAN OLEH", col2Left, 72);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.studentName, col2Left, 77);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("Siswa Terdaftar (Learnify Student)", col2Left, 82);

      // ─── 3. ITEMS TABLE (PREMIUM MINIMALIST STYLE) ─────────────────────────
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
      };

      const basePrice = Math.round(invoice.amount / 1.11);
      const ppnAmt = invoice.amount - basePrice;

      autoTable(doc, {
        startY: 102,
        margin: { left: 20, right: 20 },
        head: [["DESKRIPSI KURSUS", "INSTRUKTUR", "HARGA KURSUS"]],
        body: [
          [invoice.courseName, invoice.instructorName, formatCurrency(basePrice)]
        ],
        theme: "plain",
        headStyles: {
          fillColor: [248, 250, 252], // slate-50
          textColor: [71, 85, 105], // slate-600
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        },
        bodyStyles: {
          textColor: [15, 23, 42], // slate-900
          fontSize: 9.5,
          cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 45 },
          2: { halign: "right", cellWidth: 35 },
        },
        didDrawCell: (data) => {
          // Draw thin light gray border under the header and table body
          if (data.row.index === -1 || data.row.index === data.table.body.length - 1) {
            doc.setDrawColor(241, 245, 249); // slate-100
            doc.setLineWidth(0.5);
            doc.line(
              data.cell.x,
              data.cell.y + data.cell.height,
              data.cell.x + data.cell.width,
              data.cell.y + data.cell.height
            );
          }
        }
      });

      // ─── 4. SUMMARY & TOTALS ────────────────────────────────────────────────
      const finalY = (doc as any).lastAutoTable?.finalY || 130;

      // Draw subtle gray box for summary
      const summaryWidth = 75;
      const summaryX = pageWidth - 20 - summaryWidth;

      // Subtotal
      doc.setFontSize(9);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setFont("helvetica", "normal");
      doc.text("Harga Sebelum PPN:", summaryX, finalY + 12);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(formatCurrency(basePrice), pageWidth - 20, finalY + 12, { align: "right" });

      // PPN (11%)
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text("PPN (11%):", summaryX, finalY + 18);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(formatCurrency(ppnAmt), pageWidth - 20, finalY + 18, { align: "right" });

      // Divider inside summary
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(summaryX, finalY + 22, pageWidth - 20, finalY + 22);

      // Grand Total
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TOTAL BAYAR", summaryX, finalY + 29);
      doc.text(formatCurrency(invoice.amount), pageWidth - 20, finalY + 29, { align: "right" });

      // ─── 5. SIGNATURE & NOTICE ─────────────────────────────────────────────
      // Left side: Official Notice
      const noticeX = 20;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text("INFORMASI PERPAJAKAN & LEGAL", noticeX, finalY + 15);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      const legalText = [
        "Kwitansi ini diterbitkan secara elektronik dan sah sebagai",
        "bukti pembayaran resmi keanggotaan kelas pada Learnify LMS.",
        "Transaksi ini sudah termasuk PPN sebesar 11% sesuai dengan",
        "ketentuan perundang-undangan perpajakan di Republik Indonesia."
      ];
      doc.text(legalText, noticeX, finalY + 21);

      // ─── 6. FOOTER ──────────────────────────────────────────────────────────
      doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        "Kwitansi ini sah tanpa tanda tangan fisik karena diterbitkan secara otomatis oleh sistem Learnify.",
        pageWidth / 2,
        pageHeight - 18,
        { align: "center" }
      );
      
      doc.setFont("helvetica", "bold");
      doc.text(
        "Learnify LMS Platform  |  support@learnify.id  |  www.learnify.id",
        pageWidth / 2,
        pageHeight - 12,
        { align: "center" }
      );

      // Save PDF
      doc.save(`${invoice.invoiceNumber}.pdf`);
      toast.success("Berhasil", { description: "Kwitansi PDF premium berhasil diunduh." });
    } catch (error) {
      console.error(error);
      toast.error("Gagal", { description: "Terjadi kesalahan saat membuat kwitansi PDF." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 font-bold transition-all shadow-sm rounded-xl"
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Download PDF
    </Button>
  );
}
