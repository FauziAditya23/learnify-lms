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
    const status = searchParams.get("status"); // pending | paid | failed | expired | all
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const whereInvoice: any = {
      isDeleted: 0,
    };

    if (status && status !== "all") {
      whereInvoice.invoiceStatus = status;
    }

    // Fetch invoices with nested relations
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
            orderBy: { createdDate: "desc" },
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
      db.invoice.count({ where: whereInvoice }),
    ]);

    // Apply search filter on name/email/invoiceNumber (in-memory after DB fetch for simplicity)
    const filtered = search
      ? invoices.filter(
          (inv) =>
            inv.user.name.toLowerCase().includes(search.toLowerCase()) ||
            inv.user.email.toLowerCase().includes(search.toLowerCase()) ||
            inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            (inv.course?.title ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : invoices;

    // Summary stats
    const stats = await db.invoice.groupBy({
      by: ["invoiceStatus"],
      where: { isDeleted: 0 },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const formatted = filtered.map((inv) => ({
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

// PATCH: manually update invoice status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleId = (session.user as any).roleId;
    if (roleId !== 1) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { invoiceId, newStatus } = body;

    if (!invoiceId || !newStatus) {
      return NextResponse.json({ error: "invoiceId dan newStatus wajib diisi" }, { status: 400 });
    }

    const allowed = ["pending", "paid", "failed", "expired", "cancelled"];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceStatus: newStatus,
        lastUpdatedBy: session.user.name,
      },
    });

    // If marking as paid, also create enrollment if not exists
    if (newStatus === "paid" && updated.courseId && updated.userId) {
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: updated.userId, courseId: updated.courseId } },
        create: {
          userId: updated.userId,
          courseId: updated.courseId,
          enrollmentStatus: "active",
          createdBy: session.user.name,
        },
        update: {
          enrollmentStatus: "active",
          lastUpdatedBy: session.user.name,
        },
      });
    }

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error("[PATCH /api/admin/payments]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
