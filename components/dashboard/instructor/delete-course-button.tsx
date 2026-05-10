"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteCourseButton({ courseId, courseTitle }: { courseId: number, courseTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the course "${courseTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete course");
      }

      toast.success("Course deleted successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the course");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex-1 flex justify-center py-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
      title="Delete Course"
    >
      <Trash2 size={18} />
    </button>
  );
}
