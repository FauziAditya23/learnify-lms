import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminLayoutContent from "@/components/dashboard/admin/layout-content";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 1) {
    redirect("/dashboard");
  }

  // Fetch pending course count for sidebar badge
  const pendingCount = await db.course.count({
    where: { isPublished: false, isDeleted: 0, status: 2 },
  });

  // Fetch pending payout count
  const pendingPayoutCount = await db.withdrawal.count({
    where: { status: "pending", isDeleted: 0 },
  });

  return (
    <AdminLayoutContent 
      userName={session.user.name} 
      pendingCount={pendingCount}
      pendingPayoutCount={pendingPayoutCount}
    >
      {children}
    </AdminLayoutContent>
  );
}
