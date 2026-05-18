import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const couponId = parseInt(id, 10);

  try {
    const body = await req.json();
    const { code, discountPercent, maxUses, validUntil, status } = body;

    if (code) {
      const upperCode = code.toUpperCase();
      const existingCoupon = await db.coupon.findUnique({
        where: { code: upperCode }
      });
      if (existingCoupon && existingCoupon.id !== couponId) {
        return NextResponse.json(
          { error: `Kode kupon "${upperCode}" sudah digunakan oleh kupon lain.` },
          { status: 400 }
        );
      }
    }

    const coupon = await db.coupon.update({
      where: { id: couponId },
      data: {
        code: code?.toUpperCase() || undefined,
        discountPercent: discountPercent ? parseFloat(discountPercent) : undefined,
        maxUses: maxUses !== undefined ? parseInt(maxUses) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status: status !== undefined ? parseInt(status) : undefined,
        lastUpdatedBy: session.user.name || "Admin",
        lastUpdatedDate: new Date(),
      }
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const couponId = parseInt(id, 10);

  try {
    await db.coupon.update({
      where: { id: couponId },
      data: { isDeleted: 1, lastUpdatedBy: session.user.name || "Admin" }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
