import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).roleId !== 1) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchStr = searchParams.get("search");

    const baseWhere: any = { isDeleted: 0 };

    if (searchStr && searchStr.trim()) {
      baseWhere.OR = [
        { title: { contains: searchStr, mode: "insensitive" } },
        { instructor: { name: { contains: searchStr, mode: "insensitive" } } },
        { category: { name: { contains: searchStr, mode: "insensitive" } } },
      ];
    }

    const courses = await db.course.findMany({
      where: baseWhere,
      include: {
        instructor: { select: { name: true, email: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdDate: "desc" },
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error("[ADMIN_COURSES_EXPORT]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
