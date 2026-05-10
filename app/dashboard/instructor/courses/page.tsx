import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import InstructorHeader from "@/components/dashboard/instructor/header";
import { Clock, BookOpen, Users, Plus, Edit, Eye, MoreVertical } from "lucide-react";
import DeleteCourseButton from "@/components/dashboard/instructor/delete-course-button";

export default async function InstructorCoursesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const roleId = (session.user as any).roleId;
  if (roleId !== 2) {
    redirect("/dashboard");
  }

  const instructorId = session.user.id;

  const courses = await db.course.findMany({
    where: {
      instructorId,
      isDeleted: 0,
      status: 1
    },
    include: {
      category: true,
      _count: {
        select: { 
          lessons: { where: { isDeleted: 0 } }, 
          enrollments: { where: { isDeleted: 0, enrollmentStatus: { in: ["active", "completed"] } } } 
        }
      }
    },
    orderBy: { createdDate: "desc" }
  });

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
      <InstructorHeader 
        userName={session.user.name} 
        userRole="Instructor" 
        title="My Courses 📚" 
        subtitle={`Manage your ${courses.length} courses.`}
        actionButton={true}
      />

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 p-8">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-orange-50 text-[#FF6B4A] rounded-full flex items-center justify-center mb-6">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Kelas</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-sm">Anda belum memiliki kelas yang dipublikasikan. Mulai buat kelas pertama Anda sekarang dan bagikan ilmu ke ribuan siswa.</p>
            <Link href="/dashboard/instructor/courses/create" className="px-6 py-3 bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-100 flex items-center gap-2">
              <Plus size={18} /> Buat Kelas Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group bg-white flex flex-col">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen size={40} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      course.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : course.status === 2 
                          ? 'bg-orange-100 text-orange-700 animate-pulse' 
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {course.isPublished ? 'Published' : course.status === 2 ? 'Pending Review' : 'Draft'}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button className="w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:text-[#FF6B4A] transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-[#FF6B4A] bg-orange-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {course.category?.name || 'Uncategorized'}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-auto pt-4 text-[11px] font-bold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-300" />
                      <span>{Math.floor(course.totalMinutes / 60)}h {course.totalMinutes % 60}m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={14} className="text-slate-300" />
                      <span>{course._count.lessons} Lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto text-orange-500">
                      <Users size={14} />
                      <span>{course._count.enrollments}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-slate-50 bg-slate-50/50 flex gap-2">
                  <Link href={`/courses/${course.slug}`} target="_blank" className="flex-1 flex justify-center py-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                    <Eye size={18} />
                  </Link>
                  <Link href={`/dashboard/instructor/courses/${course.id}/edit`} className="flex-1 flex justify-center py-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit size={18} />
                  </Link>
                  <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
