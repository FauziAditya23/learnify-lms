import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Receipt, CreditCard } from "lucide-react";
import PaymentTable from "@/components/dashboard/admin/payments/payment-table";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  student: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  course: {
    id: number;
    title: string;
    thumbnail: string | null;
    category: string;
  } | null;
  latestTransaction: {
    orderId: string;
    grossAmount: number;
    transactionStatus: string;
    paymentType: string;
    transactionTime: string;
  } | null;
}

// ─── Data Fetcher ─────────────────────────────────────────────────────────────
async function getPaymentData() {
  const [invoices, stats] = await Promise.all([
    db.invoice.findMany({
      where: { isDeleted: 0 },
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
      take: 15,
    }),

    db.invoice.groupBy({
      by: ["invoiceStatus"],
      where: { isDeleted: 0 },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const total = await db.invoice.count({ where: { isDeleted: 0 } });

  const rows: PaymentRow[] = invoices.map((inv) => ({
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

  const formattedStats = stats.map((s) => ({
    status: s.invoiceStatus,
    count: s._count.id,
    totalAmount: Number(s._sum.totalAmount ?? 0),
  }));

  return { rows, stats: formattedStats, total };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminPaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/login");

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) redirect("/dashboard");

  const { rows, stats, total } = await getPaymentData();

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1600px] w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#2D2D2D] tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-[#FF6B4A] to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Receipt size={20} className="text-white" />
            </span>
            Payment Status 💳
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Monitoring pembayaran &amp; pembelian kursus oleh student
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-50 rounded-2xl shadow-sm">
          <CreditCard size={16} className="text-orange-400" />
          <span className="text-sm font-black text-slate-700">
            {total.toLocaleString("id-ID")}
          </span>
          <span className="text-sm text-slate-400 font-medium">total invoice</span>
        </div>
      </header>

      {/* Payment Table (Client Component) */}
      <PaymentTable
        initialData={rows}
        initialStats={stats}
        initialTotal={total}
      />
    </main>
  );
}
