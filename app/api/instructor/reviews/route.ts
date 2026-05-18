import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// GET /api/instructor/reviews — list all reviews for courses owned by the instructor
// Query params:
//   ?courseId=123 → filter by course (optional)
//   ?replied=true|false → filter by whether reply exists (optional)
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (session.user as any).roleId !== 2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instructorId = session.user.id;
    const { searchParams } = new URL(req.url);
    const courseIdParam = searchParams.get("courseId");
    const repliedParam = searchParams.get("replied");

    // Build reply filter: true = has reply, false = no reply, undefined = all
    const replyWhere =
      repliedParam === "true"
        ? { reply: { not: null } as any }
        : repliedParam === "false"
        ? { reply: null }
        : {};

    const reviews = await db.review.findMany({
      where: {
        course: {
          instructorId,
          isDeleted: 0,
          ...(courseIdParam ? { id: parseInt(courseIdParam, 10) } : {}),
        },
        isDeleted: 0,
        status: 1,
        ...replyWhere,
      },
      include: {
        user: { select: { name: true, image: true, email: true } },
        course: { select: { title: true, id: true } },
      },
      orderBy: { createdDate: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("[INSTRUCTOR_REVIEWS_GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
