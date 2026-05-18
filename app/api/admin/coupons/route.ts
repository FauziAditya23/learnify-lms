import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

const COMPANY = "LEARNIFY";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const coupons = await db.coupon.findMany({
      where: { isDeleted: 0 },
      orderBy: { createdDate: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, discountPercent, maxUses, validUntil } = body;

    const upperCode = code.toUpperCase();

    // Check if coupon with the same code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { code: upperCode }
    });

    if (existingCoupon) {
      if (existingCoupon.isDeleted === 1) {
        // Reactivate and update the soft-deleted coupon
        const coupon = await db.coupon.update({
          where: { id: existingCoupon.id },
          data: {
            isDeleted: 0,
            discountPercent: parseFloat(discountPercent),
            maxUses: parseInt(maxUses),
            validUntil: new Date(validUntil),
            companyCode: COMPANY,
            createdBy: session.user.name || "Admin",
            lastUpdatedBy: session.user.name || "Admin",
            lastUpdatedDate: new Date(),
          }
        });
        return NextResponse.json({ success: true, coupon });
      } else {
        return NextResponse.json(
          { error: `Kode kupon "${upperCode}" sudah terdaftar.` },
          { status: 400 }
        );
      }
    }

    const coupon = await db.coupon.create({
      data: {
        code: upperCode,
        discountPercent: parseFloat(discountPercent),
        maxUses: parseInt(maxUses),
        validUntil: new Date(validUntil),
        companyCode: COMPANY,
        createdBy: session.user.name || "Admin",
        lastUpdatedBy: session.user.name || "Admin",
      }
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
