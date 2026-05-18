import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

async function guardAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any).roleId !== 1) return null;
  return session.user;
}

// GET /api/admin/courses — list all courses with optional status filter
// Query params:
//   ?status=2  → pending review (default)
//   ?status=all → all non-deleted courses
//   ?status=1  → published/active only
export async function GET(req: NextRequest) {
  const user = await guardAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    let statusFilter: number | undefined = undefined;
    if (statusParam && statusParam !== "all") {
      statusFilter = parseInt(statusParam, 10);
    }

    const courses = await db.course.findMany({
      where: {
        isDeleted: 0,
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
      },
      include: {
        instructor: { select: { name: true, email: true, image: true } },
        category: { select: { name: true } },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
      orderBy: { createdDate: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("[ADMIN_COURSES_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
