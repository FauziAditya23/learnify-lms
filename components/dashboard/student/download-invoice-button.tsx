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
      const doc = new jsPDF();
      
      // Constants
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // 1. Header (Logo / Company Name)
      doc.setFillColor(255, 107, 74); // #FF6B4A
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Learnify.", 15, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Kwitansi Pembayaran Resmi", pageWidth - 15, 25, { align: "right" });

      // 2. Invoice Information
      doc.setTextColor(45, 45, 45); // #2D2D2D
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 15, 60);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`No. Invoice : ${invoice.invoiceNumber}`, 15, 70);
      doc.text(`Tanggal     : ${invoice.date}`, 15, 76);
      doc.text(`Status      : ${invoice.status.toUpperCase()}`, 15, 82);

      // 3. Customer Information
      doc.setFont("helvetica", "bold");
      doc.text("Dibayarkan Oleh:", pageWidth - 15, 60, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(invoice.studentName, pageWidth - 15, 70, { align: "right" });

      // 4. Items Table
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(amount);
      };

      autoTable(doc, {
        startY: 100,
        head: [["Nama Kursus", "Instruktur", "Harga"]],
        body: [
          [invoice.courseName, invoice.instructorName, formatCurrency(invoice.amount)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 74] }, // orange
        styles: { font: "helvetica", fontSize: 10 },
        columnStyles: {
          2: { halign: 'right' }
        }
      });

      // 5. Total
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL LUNAS", pageWidth - 80, finalY + 15);
      doc.text(formatCurrency(invoice.amount), pageWidth - 15, finalY + 15, { align: "right" });

      // 6. Footer
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Terima kasih telah belajar bersama Learnify.", pageWidth / 2, 280, { align: "center" });

      // Save PDF
      doc.save(`${invoice.invoiceNumber}.pdf`);
      toast.success("Berhasil", { description: "Invoice PDF berhasil diunduh." });
    } catch (error) {
      console.error(error);
      toast.error("Gagal", { description: "Terjadi kesalahan saat membuat PDF." });
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
      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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
