import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpen, Tag, Clock, CheckCircle, XCircle } from "lucide-react";
import CourseFilters from "@/components/dashboard/admin/courses/course-filters";
import CourseTable from "@/components/dashboard/admin/courses/course-table";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Data Fetcher ──────────────────────────────────────────────────────────────
async function getCoursesData(page: number = 1, pageSize: number = 10, searchStr?: string) {
  const baseWhere: any = { isDeleted: 0 };

  if (searchStr && searchStr.trim()) {
    baseWhere.OR = [
      { title: { contains: searchStr, mode: "insensitive" } },
      { instructor: { name: { contains: searchStr, mode: "insensitive" } } },
      { category: { name: { contains: searchStr, mode: "insensitive" } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [coursesData, totalCoursesCount] = await Promise.all([
    db.course.findMany({
      where: baseWhere,
      include: {
        instructor: { select: { name: true, email: true } },
        category: { select: { name: true } },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { createdDate: "desc" },
      skip,
      take: pageSize,
    }),
    db.course.count({ where: baseWhere }),
  ]);

  const courses = coursesData.map((c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    thumbnail: c.thumbnail,
    category: c.category.name,
    level: c.level,
    instructor: c.instructor.name,
    instructorEmail: c.instructor.email,
    price: Number(c.price),
    status: c.status,
    isPublished: c.isPublished,
    totalLessons: c._count.lessons,
    totalEnrollments: c._count.enrollments,
    date: (c.createdDate as Date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  const totalPages = Math.ceil(totalCoursesCount / pageSize);

  return { courses, totalPages, totalCoursesCount };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function AdminCoursesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/login");

  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

  const { courses, totalPages, totalCoursesCount } = await getCoursesData(page, 10, search);

  // Statistics
  const totalPublished = courses.filter((c: any) => c.isPublished).length;
  const totalDraft = courses.filter((c: any) => !c.isPublished && c.status === 1).length;
  const totalPending = courses.filter((c: any) => c.status === 2).length;

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1600px] w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#2D2D2D] tracking-tight flex items-center gap-3">
            All Courses 📚
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1">
            Kelola semua data kursus dalam platform.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <CourseFilters />
        </div>
      </header>

      {/* Stats (from current page data only for simplicity, or we could fetch total global stats) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Courses</p>
            <h4 className="text-xl font-black text-[#2D2D2D]">{totalCoursesCount}</h4>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <CourseTable 
          courses={courses} 
          page={page} 
          totalPages={totalPages} 
          totalCourses={totalCoursesCount} 
        />
      </div>
    </main>
  );
}
