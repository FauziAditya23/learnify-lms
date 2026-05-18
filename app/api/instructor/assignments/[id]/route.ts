import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function guardInstructor(assignmentId: number, instructorId: string) {
  return db.assignment.findFirst({
    where: { id: assignmentId, isDeleted: 0, course: { instructorId } },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || (session.user as any).roleId !== 2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = parseInt(id);
    const instructorId = session.user.id;

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, isDeleted: 0, course: { instructorId } },
      include: {
        course: { select: { title: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("[ASSIGNMENT_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || (session.user as any).roleId !== 2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = parseInt(id);
    const instructorId = session.user.id;

    const existing = await guardInstructor(assignmentId, instructorId);
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, dueDate } = body;

    const updated = await db.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        lastUpdatedBy: session.user.name || instructorId,
        lastUpdatedDate: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ASSIGNMENT_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || (session.user as any).roleId !== 2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = parseInt(id);
    const instructorId = session.user.id;

    const existing = await guardInstructor(assignmentId, instructorId);
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    await db.assignment.update({
      where: { id: assignmentId },
      data: { isDeleted: 1, lastUpdatedBy: session.user.name || instructorId },
    });

    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("[ASSIGNMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
