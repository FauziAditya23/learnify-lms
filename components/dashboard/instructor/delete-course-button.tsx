"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteCourseButton({ courseId, courseTitle }: { courseId: number, courseTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete course");
      }

      toast.success("Course deleted successfully");
      setShowModal(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the course");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isDeleting}
        className="flex-1 flex justify-center py-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Delete Course"
      >
        <Trash2 size={18} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Hapus Kursus?</h3>
            <p className="text-slate-500 text-sm text-center mb-8">
              Anda yakin ingin menghapus kursus <span className="font-bold text-slate-700">"{courseTitle}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
