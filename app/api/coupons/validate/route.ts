import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, courseId } = body;

    if (!code) {
      return NextResponse.json({ error: "Kode kupon tidak boleh kosong" }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || coupon.isDeleted === 1 || coupon.status !== 1) {
      return NextResponse.json({ error: "Kupon tidak valid atau tidak ditemukan" }, { status: 404 });
    }

    if (coupon.validUntil < new Date()) {
      return NextResponse.json({ error: "Kupon sudah kedaluwarsa" }, { status: 400 });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Kupon sudah mencapai batas penggunaan maksimum" }, { status: 400 });
    }

    // Optional: You could check if user already used this coupon in an invoice if needed
    // For now, we return valid.

    return NextResponse.json({ 
      success: true, 
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
      } 
    });
  } catch (error) {
    console.error("[COUPON_VALIDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
