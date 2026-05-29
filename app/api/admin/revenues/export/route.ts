import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.roleId !== 1) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let whereClause: any = {
      invoiceStatus: "paid",
      isDeleted: 0,
    };

    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        course: { 
          include: {
            instructor: { select: { name: true } }
          }
        },
      },
      orderBy: { createdDate: "desc" },
    });

    const format = searchParams.get("format");
    if (format === "json") {
      const data = invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        createdDate: inv.createdDate.toISOString(),
        totalAmount: Number(inv.totalAmount),
        student: {
          name: inv.user?.name || "-",
          email: inv.user?.email || "-",
        },
        course: inv.course ? {
          title: inv.course.title,
          instructor: inv.course.instructor?.name || "-",
        } : null,
      }));
      return NextResponse.json({ data });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Learnify LMS";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Laporan Keuangan", {
      views: [{ showGridLines: false }],
    });

    // 1. Title
    worksheet.mergeCells("A1:G2");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "LAPORAN KEUANGAN TRANSAKSI KURSUS - LEARNIFY";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEA580C" }, // Tailwind orange-600
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // 2. Subtitle / Info
    worksheet.mergeCells("A3:G3");
    const subtitleCell = worksheet.getCell("A3");
    subtitleCell.value = `Periode: ${startDateParam ? `${startDateParam} s/d ${endDateParam}` : "Semua Waktu"} | Diunduh pada: ${new Date().toLocaleString("id-ID")}`;
    subtitleCell.font = { name: "Arial", size: 10, italic: true };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };

    // Spacer
    worksheet.addRow([]);

    // 3. Table Header
    const headerRow = worksheet.addRow([
      "No",
      "Tanggal Transaksi",
      "No. Invoice",
      "Siswa (Pembeli)",
      "Nama Kursus",
      "Instruktur",
      "Nominal Pendapatan"
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF97316" }, // Tailwind orange-500
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 4. Data Rows
    let totalRevenue = 0;
    invoices.forEach((inv, index) => {
      const row = worksheet.addRow([
        index + 1,
        new Date(inv.createdDate).toLocaleString("id-ID"),
        inv.invoiceNumber,
        inv.user?.name || "-",
        inv.course?.title || "-",
        inv.course?.instructor?.name || "-",
        Number(inv.totalAmount)
      ]);

      totalRevenue += Number(inv.totalAmount);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        // Nominal format
        if (colNumber === 7) {
          cell.numFmt = '"Rp"#,##0;[Red]\-"Rp"#,##0';
        }
      });
    });

    // 5. Total Row
    const totalRow = worksheet.addRow(["", "", "", "", "", "TOTAL PENDAPATAN:", totalRevenue]);
    totalRow.eachCell((cell, colNumber) => {
      if (colNumber >= 6) {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEDD5" }, // orange-50
        };
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
      if (colNumber === 7) {
        cell.numFmt = '"Rp"#,##0;[Red]\-"Rp"#,##0';
      }
    });

    // 6. Column Widths
    worksheet.getColumn(1).width = 5;  // No
    worksheet.getColumn(2).width = 20; // Tanggal
    worksheet.getColumn(3).width = 25; // Invoice
    worksheet.getColumn(4).width = 30; // Siswa
    worksheet.getColumn(5).width = 40; // Kursus
    worksheet.getColumn(6).width = 25; // Instruktur
    worksheet.getColumn(7).width = 20; // Nominal

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Keuangan_Learnify_${new Date().getTime()}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
