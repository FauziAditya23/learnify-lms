import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// ─── GET /api/payment/status?invoiceNumber=INV-xxx ────────────────────────────
// Digunakan oleh checkout page untuk polling status pembayaran secara realtime
// (khusus metode async seperti Virtual Account yang tidak langsung redirect balik)
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invoiceNumber = searchParams.get("invoiceNumber");

  if (!invoiceNumber) {
    return NextResponse.json({ error: "invoiceNumber wajib diisi" }, { status: 400 });
  }

  const invoice = await db.invoice.findFirst({
    where: {
      invoiceNumber,
      userId: session.user.id,
      isDeleted: 0,
    },
    select: {
      invoiceStatus: true,
      dueDate: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  }

  // Cek apakah sudah expired
  const isExpired = new Date() > new Date(invoice.dueDate);

  return NextResponse.json({
    status: invoice.invoiceStatus,       // "pending" | "paid" | "cancelled"
    isExpired: isExpired && invoice.invoiceStatus === "pending",
  });
}
