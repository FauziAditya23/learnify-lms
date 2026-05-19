import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { sendEmail, invoicePendingEmailTemplate } from "@/lib/email";

const COMPANY = "LEARNIFY";
const SYSTEM  = "SYSTEM";

// ─── GET /api/enrollments — Daftar kursus yang di-enroll user ────────────────
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      userId: session.user.id,
      isDeleted: 0,
      status: 1,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          totalLessons: true,
          totalMinutes: true,
          level: true,
          rating: true,
          category: { select: { name: true, slug: true } },
          instructor: { select: { name: true, image: true } },
        },
      },
      certificate: {
        select: { id: true },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Hitung progress per enrollment
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const completedLessons = await db.lessonProgress.count({
        where: {
          userId: session.user.id,
          lesson: { courseId: enrollment.courseId },
          isCompleted: true,
          isDeleted: 0,
        },
      });

      const progressPercent =
        enrollment.course.totalLessons > 0
          ? Math.round((completedLessons / enrollment.course.totalLessons) * 100)
          : 0;

      return {
        ...enrollment,
        completedLessons,
        progressPercent,
      };
    })
  );

  return NextResponse.json(enrollmentsWithProgress);
}

// ─── POST /api/enrollments — Enroll user ke kursus ──────────────────────────
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, couponCode } = body;

  if (!courseId || typeof courseId !== "number") {
    return NextResponse.json({ error: "courseId wajib diisi" }, { status: 400 });
  }

  // 1. Validasi kursus ada dan aktif
  const course = await db.course.findFirst({
    where: { id: courseId, isPublished: true, isDeleted: 0, status: 1 },
  });

  if (!course) {
    return NextResponse.json({ error: "Kursus tidak ditemukan" }, { status: 404 });
  }

  // 2. Cek sudah enroll belum (hanya blokir jika statusnya aktif)
  const existing = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      isDeleted: 0,
      enrollmentStatus: "active",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Kamu sudah terdaftar di kursus ini", enrollment: existing },
      { status: 409 }
    );
  }

  // 3. Cek kupon
  let discountPercent = 0;
  let validCoupon = null;

  if (couponCode) {
    validCoupon = await db.coupon.findUnique({ where: { code: couponCode } });
    if (validCoupon && validCoupon.status === 1 && validCoupon.isDeleted === 0 && validCoupon.validUntil >= new Date()) {
      if (validCoupon.maxUses === 0 || validCoupon.usedCount < validCoupon.maxUses) {
        discountPercent = Number(validCoupon.discountPercent);
      } else {
        validCoupon = null; // invalid due to max uses
      }
    } else {
      validCoupon = null;
    }
  }

  // ─── 4. Routing: Gratis vs Berbayar ──────────────────────────────────────
  let finalPrice = Number(course.price);
  let discountAmt = 0;

  if (discountPercent > 0) {
    discountAmt = (finalPrice * discountPercent) / 100;
    finalPrice = Math.max(0, finalPrice - discountAmt);
  }

  const isFree = finalPrice === 0;

  if (isFree) {
    // ── FREE: Langsung buat enrollment ──────────────────────────────────
    const enrollment = await db.enrollment.upsert({
      where: {
        userId_courseId: { userId: session.user.id, courseId }
      },
      update: {
        enrollmentStatus: "active",
        enrolledAt: new Date(),
        status: 1,
        isDeleted: 0,
        lastUpdatedBy: session.user.id,
        lastUpdatedDate: new Date(),
      },
      create: {
        userId: session.user.id,
        courseId,
        enrollmentStatus: "active",
        enrolledAt: new Date(),
        companyCode: COMPANY,
        status: 1,
        isDeleted: 0,
        createdBy: session.user.id,
        createdDate: new Date(),
        lastUpdatedBy: session.user.id,
        lastUpdatedDate: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        type: "free",
        message: "Berhasil mendaftar kursus gratis!",
        enrollment,
        redirectUrl: `/courses/${course.slug}/learn`,
      },
      { status: 201 }
    );
  } else {
    // ── PAID: Buat Invoice + Enrollment pending_payment ──────────────
    const invoiceNumber = generateInvoiceNumber();
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const [invoice] = await db.$transaction([
      db.invoice.create({
        data: {
          userId: session.user.id,
          courseId,              // ← fix: link invoice ke kursus
          invoiceNumber,
          totalAmount: finalPrice,
          couponId: validCoupon?.id,
          discountAmt: discountAmt,
          invoiceStatus: "pending",
          dueDate,
          companyCode: COMPANY,
          status: 1,
          isDeleted: 0,
          createdBy: session.user.id,
          createdDate: new Date(),
          lastUpdatedBy: session.user.id,
          lastUpdatedDate: new Date(),
        },
      }),
      // Buat enrollment dengan status pending_payment
      // Akan diupdate ke "active" oleh webhook Midtrans setelah pembayaran berhasil
      db.enrollment.upsert({
        where: {
          userId_courseId: { userId: session.user.id, courseId }
        },
        update: {
          enrollmentStatus: "pending_payment",
          status: 1,
          isDeleted: 0,
          lastUpdatedBy: session.user.id,
          lastUpdatedDate: new Date(),
        },
        create: {
          userId: session.user.id,
          courseId,
          enrollmentStatus: "pending_payment",
          enrolledAt: new Date(),
          companyCode: COMPANY,
          status: 1,
          isDeleted: 0,
          createdBy: session.user.id,
          createdDate: new Date(),
          lastUpdatedBy: session.user.id,
          lastUpdatedDate: new Date(),
        },
      }),
      ...(validCoupon ? [
        db.coupon.update({
          where: { id: validCoupon.id },
          data: { usedCount: { increment: 1 } },
        })
      ] : []),
    ]);

    // Format currency
    const fmtAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(finalPrice);

    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${invoice.invoiceNumber}`;

    // Send async email notification
    sendEmail({
      to: session.user.email,
      subject: `Tagihan Menunggu Pembayaran: ${course.title}`,
      html: invoicePendingEmailTemplate(
        session.user.name,
        course.title,
        invoice.invoiceNumber,
        fmtAmount,
        checkoutUrl
      )
    }).catch(err => console.error("Failed to send pending invoice email:", err));

    return NextResponse.json(
      {
        success: true,
        type: "paid",
        message: "Invoice berhasil dibuat. Lanjutkan pembayaran.",
        invoice,
        redirectUrl: `/checkout/${invoice.invoiceNumber}`,
      },
      { status: 201 }
    );
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${date}-${random}`;
}
