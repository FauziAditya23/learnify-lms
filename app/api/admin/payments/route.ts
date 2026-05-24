import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const status = searchParams.get("status"); // pending | paid | failed | expired | cancelled | all
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "15"));
    const skip = (page - 1) * limit;

    // ── Build WHERE clause di sisi database (bukan in-memory) ──────────────
    const whereInvoice: any = {
      isDeleted: 0,
      status: 1, // hanya invoice aktif
    };

    // Filter status invoice
    if (status && status !== "all") {
      whereInvoice.invoiceStatus = status;
    }

    // Search: filter di level DB agar pagination akurat
    if (search.trim()) {
      whereInvoice.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    // ── Fetch data + total count dengan where yang sama ───────────────────
    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where: whereInvoice,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              category: {
                select: { name: true },
              },
            },
          },
          transactions: {
            where: { isDeleted: 0 }, // hanya transaksi aktif
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
        skip,
        take: limit,
      }),
      db.invoice.count({ where: whereInvoice }), // count pakai where yang sama!
    ]);

    // ── Summary stats (selalu dari semua invoice aktif, bukan difilter search) ──
    const stats = await db.invoice.groupBy({
      by: ["invoiceStatus"],
      where: { isDeleted: 0, status: 1 },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // ── Serialize data ─────────────────────────────────────────────────────
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

    return NextResponse.json({
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: stats.map((s) => ({
        status: s.invoiceStatus,
        count: s._count.id,
        totalAmount: Number(s._sum.totalAmount ?? 0),
      })),
    });
  } catch (error: any) {
    console.error("[GET /api/admin/payments]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH: update status invoice secara manual ────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleId = (session.user as any).roleId;
    if (roleId !== 1) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, newStatus } = body;

    if (!invoiceId || !newStatus) {
      return NextResponse.json(
        { error: "invoiceId dan newStatus wajib diisi" },
        { status: 400 }
      );
    }

    const allowed = ["pending", "paid", "failed", "expired", "cancelled"];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // Cek invoice dulu — pastikan ada dan tidak terhapus
    const invoice = await db.invoice.findFirst({
      where: { id: Number(invoiceId), isDeleted: 0 },
      select: { id: true, userId: true, courseId: true, invoiceStatus: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    // Update status invoice
    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        invoiceStatus: newStatus,
        lastUpdatedBy: session.user.name ?? "ADMIN",
      },
    });

    // Jika diubah jadi "paid", buat enrollment jika belum ada
    if (newStatus === "paid" && invoice.courseId != null) {
      await db.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: invoice.userId,
            courseId: invoice.courseId,
          },
        },
        create: {
          userId: invoice.userId,
          courseId: invoice.courseId,
          enrollmentStatus: "active",
          createdBy: session.user.name ?? "ADMIN",
        },
        update: {
          enrollmentStatus: "active",
          isDeleted: 0,
          status: 1,
          lastUpdatedBy: session.user.name ?? "ADMIN",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status invoice berhasil diubah ke "${newStatus}"`,
      invoice: {
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        invoiceStatus: updated.invoiceStatus,
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/admin/payments]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
