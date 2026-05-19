import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
  sendEmail, 
  paymentSuccessEmailTemplate,
  instructorCourseSoldEmailTemplate,
  adminNewSaleEmailTemplate 
} from "@/lib/email";

const COMPANY = "LEARNIFY";

// ─── POST /api/payment/midtrans/notification ───────────────────────────────────
// Midtrans akan memanggil endpoint ini setiap kali status transaksi berubah.
// PENTING: endpoint ini tidak butuh auth header — Midtrans yang memanggil.
// Keamanan dijaga lewat verifikasi signature_key.
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id,
    transaction_status,
    payment_type,
    gross_amount,
    signature_key,
    transaction_time,
    fraud_status,
  } = body;

  // 1. Verifikasi signature key
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const expectedSignature = await sha512(`${order_id}${body.status_code}${gross_amount}${serverKey}`);

  if (signature_key !== expectedSignature) {
    console.error("[Midtrans Webhook] Signature mismatch:", { order_id });
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // 2. Tentukan status invoice berdasarkan transaction_status dari Midtrans
  // Referensi: https://docs.midtrans.com/reference/transaction-status
  let invoiceStatus: string;
  let transactionStatus: string;

  if (
    transaction_status === "capture" ||
    transaction_status === "settlement"
  ) {
    if (fraud_status === "challenge") {
      // Fraud review — tahan dulu, jangan aktifkan enrollment
      invoiceStatus = "pending";
      transactionStatus = "challenge";
    } else {
      invoiceStatus = "paid";
      transactionStatus = "settlement";
    }
  } else if (transaction_status === "pending") {
    invoiceStatus = "pending";
    transactionStatus = "pending";
  } else if (
    transaction_status === "deny" ||
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "failure"
  ) {
    invoiceStatus = "cancelled";
    transactionStatus = transaction_status;
  } else {
    invoiceStatus = "pending";
    transactionStatus = transaction_status;
  }

  // Parse invoice number from order_id — format: INV-YYYYMMDD-XXXX[-timestamp]
  // Regex lebih robust dibanding split
  const invoiceMatch = order_id.match(/^(INV-\d{8}-[A-Z0-9]+)/);
  const parsedInvoiceNumber = invoiceMatch ? invoiceMatch[1] : order_id;

  // 3. Ambil invoice
  const invoice = await db.invoice.findUnique({
    where: { invoiceNumber: parsedInvoiceNumber },
    include: {
      user: true,
      course: {
        include: { instructor: true }
      },
    }
  });

  if (!invoice) {
    console.error("[Midtrans Webhook] Invoice tidak ditemukan:", order_id);
    return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  }

  // IDEMPOTENCY: Jika invoice sudah paid dan webhook ini juga paid, skip processing
  if (invoice.invoiceStatus === "paid" && invoiceStatus === "paid") {
    console.log("[Midtrans Webhook] Invoice already paid, skipping duplicate:", parsedInvoiceNumber);
    return NextResponse.json({ status: "already_processed" });
  }

  // 4. Upsert transaction record
  await db.transaction.upsert({
    where: { orderId: order_id },
    update: {
      transactionStatus,
      lastUpdatedBy: "MIDTRANS",
      lastUpdatedDate: new Date(),
    },
    create: {
      invoiceId: invoice.id,
      orderId: order_id,
      grossAmount: parseFloat(gross_amount),
      transactionStatus,
      paymentType: payment_type ?? "unknown",
      signatureKey: signature_key,
      transactionTime: transaction_time ? new Date(transaction_time) : new Date(),
      companyCode: COMPANY,
      status: 1,
      isDeleted: 0,
      createdBy: "MIDTRANS",
      createdDate: new Date(),
      lastUpdatedBy: "MIDTRANS",
      lastUpdatedDate: new Date(),
    },
  });

  // 5. Update invoice status
  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      invoiceStatus,
      lastUpdatedBy: "MIDTRANS",
      lastUpdatedDate: new Date(),
    },
  });

  // 6. Jika pembayaran berhasil, buat enrollment otomatis
  if (invoiceStatus === "paid") {
    // Cari kursus terkait dari invoice — lewat invoice number format INV-YYYYMMDD-XXXX
    // Invoice hanya punya 1 kursus (per enrollment flow yang kita buat)
    // Kita perlu mapping invoice → course. Simpan courseId di invoice transactions.
    // Untuk sekarang, cari enrollment pending dengan invoiceId
    const pendingEnrollment = await db.enrollment.findFirst({
      where: {
        userId: invoice.userId,
        courseId: invoice.courseId || undefined,
        enrollmentStatus: "pending_payment",
        isDeleted: 0,
      },
      orderBy: { createdDate: "desc" },
    });

    if (pendingEnrollment) {
      await db.enrollment.update({
        where: { id: pendingEnrollment.id },
        data: {
          enrollmentStatus: "active",
          enrolledAt: new Date(),
          lastUpdatedBy: "MIDTRANS",
          lastUpdatedDate: new Date(),
        },
      });
    }

    // Send async payment success email notification
    if (invoice.user && invoice.course) {
      const fmtAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(Number(invoice.totalAmount));

      const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${invoice.course.slug}/learn`;

      // 1. Notifikasi Email ke Siswa
      sendEmail({
        to: invoice.user.email,
        subject: `Pembayaran Berhasil: ${invoice.course.title}`,
        html: paymentSuccessEmailTemplate(
          invoice.user.name,
          invoice.course.title,
          invoice.invoiceNumber,
          fmtAmount,
          courseUrl
        )
      }).catch(err => console.error("Failed to send payment success email:", err));

      // 2. Notifikasi Email ke Instruktur
      if (invoice.course.instructor?.email) {
        sendEmail({
          to: invoice.course.instructor.email,
          subject: `Hore! Kursus ${invoice.course.title} Terjual 🎉`,
          html: instructorCourseSoldEmailTemplate(
            invoice.course.instructor.name,
            invoice.course.title,
            invoice.user.name,
            fmtAmount
          )
        }).catch(err => console.error("Failed to send instructor email:", err));
      }

      // 3. Notifikasi Email ke Admin
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `Penjualan Baru: ${invoice.course.title} 💰`,
          html: adminNewSaleEmailTemplate(
            invoice.course.title,
            invoice.user.name,
            fmtAmount,
            invoice.invoiceNumber
          )
        }).catch(err => console.error("Failed to send admin email:", err));
      } else {
        console.warn("[Midtrans Webhook] ADMIN_EMAIL tidak diset di .env — notifikasi admin dilewati.");
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}

// ─── SHA-512 helper ───────────────────────────────────────────────────────────
async function sha512(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-512", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
