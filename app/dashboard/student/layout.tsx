import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import StudentSidebar from "@/components/dashboard/student/sidebar";

export default async function StudentLayout({
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
  if (roleId !== 3) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-[#F8F9FB] font-sans text-[#1E1E1E]">
      <StudentSidebar userName={session.user.name} />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-16 xl:pb-0">
        {children}
      </div>
    </div>
  );
}
