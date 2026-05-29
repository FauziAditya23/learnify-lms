import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, ArrowUpRight, Download } from "lucide-react";
import RevenueFilters from "@/components/dashboard/admin/revenues/revenue-filters";
import TransactionTable from "@/components/dashboard/admin/revenues/transaction-table";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Data Fetcher ──────────────────────────────────────────────────────────────
async function getRevenueData(startStr?: string, endStr?: string, page: number = 1, pageSize: number = 10) {
  const now = new Date();
  
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  if (startStr && endStr) {
    startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endStr);
    endDate.setHours(23, 59, 59, 999);
  }

  // Base where clause for total and top courses (ignores date filters for all-time stats)
  const baseWhere = { isDeleted: 0, invoiceStatus: "paid" };

  // Filtered where clause for transactions and filtered revenue
  const filterWhere = {
    ...baseWhere,
    createdDate: { gte: startDate, lte: endDate },
  };

  const skip = (page - 1) * pageSize;

  const [
    totalRevenueAgg,
    filteredRevenueAgg,
    topCourses,
    transactionsData,
    totalTransactionsCount,
  ] = await Promise.all([
    // Total revenue ALL TIME
    db.invoice.aggregate({
      where: baseWhere,
      _sum: { totalAmount: true },
    }),

    // Revenue in filtered period
    db.invoice.aggregate({
      where: filterWhere,
      _sum: { totalAmount: true },
    }),

    // Top earning courses (all time)
    db.course.findMany({
      where: { isDeleted: 0, isPublished: true },
      select: {
        id: true,
        title: true,
        price: true,
        _count: { select: { enrollments: { where: { isDeleted: 0 } } } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),

    // Paginated transactions
    db.invoice.findMany({
      where: filterWhere,
      include: {
        user: { select: { name: true, email: true } },
        course: { include: { instructor: { select: { name: true } } } },
      },
      orderBy: { createdDate: "desc" },
      skip,
      take: pageSize,
    }),

    // Total count for pagination
    db.invoice.count({ where: filterWhere }),
  ]);

  const totalRevenue = Number(totalRevenueAgg._sum.totalAmount ?? 0);
  const filteredRevenue = Number(filteredRevenueAgg._sum.totalAmount ?? 0);
  // Instructor payout estimate: 60% of total revenue
  const instructorPayouts = Math.round(totalRevenue * 0.6);

  // Top courses with revenue calc
  const maxEnrollments = Math.max(
    ...topCourses.map((c) => c._count.enrollments),
    1
  );
  const topCoursesFormatted = topCourses.map((c: any) => ({
    name: c.title,
    revenue: c._count.enrollments * Number(c.price),
    students: c._count.enrollments,
    percent: Math.round((c._count.enrollments / maxEnrollments) * 100),
  }));

  // Full paginated transactions
  const transactions = transactionsData.map((inv: any) => ({
    id: inv.id,
    course: inv.course?.title || inv.invoiceNumber,
    instructor: inv.course?.instructor?.name || "—",
    studentName: inv.user?.name || "—",
    amount: fmt(Number(inv.totalAmount)),
    date: (inv.createdDate as Date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const totalPages = Math.ceil(totalTransactionsCount / pageSize);

  return {
    totalRevenue,
    filteredRevenue,
    instructorPayouts,
    topCoursesFormatted,
    transactions,
    totalPages,
    totalTransactionsCount,
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function AdminRevenuesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/login");

  // Next.js 15+ searchParams handling
  const searchParams = await props.searchParams;
  const start = typeof searchParams.start === "string" ? searchParams.start : undefined;
  const end = typeof searchParams.end === "string" ? searchParams.end : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const {
    totalRevenue,
    filteredRevenue,
    instructorPayouts,
    topCoursesFormatted,
    transactions,
    totalPages,
    totalTransactionsCount,
  } = await getRevenueData(start, end, page, 10);

  const stats = [
    {
      label: "Total Revenue",
      value: fmt(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Filtered Revenue",
      value: fmt(filteredRevenue),
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Instructor Payouts",
      value: fmt(instructorPayouts),
      icon: ArrowUpRight,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1600px] w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#2D2D2D] tracking-tight">
            Course Revenues 💵
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live data dari Invoice DB
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <RevenueFilters />
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2.5rem] border border-orange-50 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center`}
            >
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <h4 className="text-xl font-black text-[#2D2D2D]">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Earning Courses */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-orange-50 p-8">
          <h3 className="font-black text-[#2D2D2D] text-lg mb-6">
            Top Earning Courses
          </h3>
          {topCoursesFormatted.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              Belum ada data revenue.
            </p>
          ) : (
            <div className="space-y-5">
              {topCoursesFormatted.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-700 line-clamp-1 flex-1 mr-4">
                      {c.name}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-orange-600">
                        {fmt(c.revenue)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {c.students} students
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-orange-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Transactions Table */}
        <TransactionTable 
          transactions={transactions} 
          page={page} 
          totalPages={totalPages} 
          totalTransactions={totalTransactionsCount}
        />
      </div>
    </main>
  );
}
