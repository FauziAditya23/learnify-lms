import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSessionAndVerify(courseId: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) return { error: "Unauthorized", status: 401, session: null, course: null };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found", status: 404, session: null, course: null };

  const roleId = (session.user as any).roleId;
  if (roleId !== 1 && course.instructorId !== session.user.id) {
    return { error: "Forbidden", status: 403, session: null, course: null };
  }

  return { error: null, status: 200, session, course };
}

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const courseId = parseInt(params.id);
    const parsedLessonId = parseInt(params.lessonId);

    const { error, status } = await getSessionAndVerify(courseId);
    if (error) return NextResponse.json({ error }, { status });

    const lesson = await prisma.lesson.findUnique({
      where: { id: parsedLessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json({ error: "Lesson not found in this course" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Get lesson error:", error);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: any) {
  try {
    const params = await context.params;
    const courseId = parseInt(params.id);
    const parsedLessonId = parseInt(params.lessonId);

    const { error, status } = await getSessionAndVerify(courseId);
    if (error) return NextResponse.json({ error }, { status });

    const lesson = await prisma.lesson.findUnique({ where: { id: parsedLessonId } });
    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json({ error: "Lesson not found in this course" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, videoUrl, isFree, duration, order } = body;

    const oldDuration = lesson.duration ?? 0;
    const newDuration = duration !== undefined ? parseInt(duration) : oldDuration;
    const durationDiff = newDuration - oldDuration;

    const updatedLesson = await prisma.lesson.update({
      where: { id: parsedLessonId },
      data: {
        title: title !== undefined ? title : lesson.title,
        description: description !== undefined ? description : lesson.description,
        videoUrl: videoUrl !== undefined ? videoUrl : lesson.videoUrl,
        isFree: isFree !== undefined ? isFree : lesson.isFree,
        duration: newDuration,
        order: order !== undefined ? parseInt(order) : lesson.order,
      },
    });

    // Sync course totalMinutes if duration changed
    if (durationDiff !== 0) {
      await prisma.course.update({
        where: { id: courseId },
        data: { totalMinutes: { increment: durationDiff } },
      });
    }

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const courseId = parseInt(params.id);
    const parsedLessonId = parseInt(params.lessonId);

    const { error, status } = await getSessionAndVerify(courseId);
    if (error) return NextResponse.json({ error }, { status });

    const lesson = await prisma.lesson.findUnique({ where: { id: parsedLessonId } });
    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json({ error: "Lesson not found in this course" }, { status: 404 });
    }

    await prisma.lesson.delete({ where: { id: parsedLessonId } });

    // Sync course counters
    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalLessons: { decrement: 1 },
        totalMinutes: { decrement: lesson.duration ?? 0 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
