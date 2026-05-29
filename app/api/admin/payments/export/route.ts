import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/admin/payments/export
 *
 * Sama seperti /api/admin/payments tapi:
 *  - Tidak ada batasan limit (ambil semua yang cocok dengan filter)
 *  - Hanya boleh diakses admin (roleId === 1)
 *
 * Query params:
 *  - status: "all" | "pending" | "paid" | "failed" | "expired" | "cancelled"
 *  - search: string
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleId = (session.user as any).roleId;
    if (roleId !== 1) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";

    // ── Build WHERE clause ────────────────────────────────────────────────────
    const whereInvoice: any = {
      isDeleted: 0,
      status: 1,
    };

    if (status && status !== "all") {
      whereInvoice.invoiceStatus = status;
    }

    if (search.trim()) {
      whereInvoice.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    // ── Fetch ALL matching rows (no pagination) ───────────────────────────────
    const invoices = await db.invoice.findMany({
      where: whereInvoice,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            category: { select: { name: true } },
          },
        },
        transactions: {
          where: { isDeleted: 0 },
          orderBy: { transactionTime: "desc" },
          take: 1,
          select: {
            id: true,
            orderId: true,
            grossAmount: true,
            transactionStatus: true,
            paymentType: true,
            transactionTime: true,
          },
        },
        coupon: {
          select: { code: true, discountPercent: true },
        },
      },
      orderBy: { createdDate: "desc" },
    });

    // ── Serialize ─────────────────────────────────────────────────────────────
    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceStatus: inv.invoiceStatus,
      totalAmount: Number(inv.totalAmount),
      discountAmt: Number(inv.discountAmt ?? 0),
      dueDate: inv.dueDate.toISOString(),
      createdDate: inv.createdDate.toISOString(),
      couponCode: inv.coupon?.code ?? null,
      discountPercent: inv.coupon ? Number(inv.coupon.discountPercent) : null,
      student: {
        id: inv.user.id,
        name: inv.user.name,
        email: inv.user.email,
        image: inv.user.image,
      },
      course: inv.course
        ? {
            id: inv.course.id,
            title: inv.course.title,
            thumbnail: inv.course.thumbnail,
            category: inv.course.category?.name ?? "-",
          }
        : null,
      latestTransaction: inv.transactions[0]
        ? {
            orderId: inv.transactions[0].orderId,
            grossAmount: Number(inv.transactions[0].grossAmount),
            transactionStatus: inv.transactions[0].transactionStatus,
            paymentType: inv.transactions[0].paymentType,
            transactionTime: inv.transactions[0].transactionTime.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ data: formatted, total: formatted.length });
  } catch (error: any) {
    console.error("[GET /api/admin/payments/export]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
