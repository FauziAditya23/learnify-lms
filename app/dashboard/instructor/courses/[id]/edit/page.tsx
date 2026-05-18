"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Video, Plus, Trash2, GripVertical, CheckCircle2, FileQuestion, Type, Clock, Globe, FileText, Calendar, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizBuilder } from "@/components/dashboard/instructor/quiz-builder";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const courseId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Quiz Builder State
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Assignment State
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "" });

  // Add Lesson State
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: "", description: "", videoUrl: "", duration: "", isFree: false });

  // Edit Lesson State
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editLessonData, setEditLessonData] = useState({ title: "", videoUrl: "", duration: "", isFree: false });

  // Edit Assignment State
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editAssignmentData, setEditAssignmentData] = useState({ title: "", description: "", dueDate: "" });

  // Delete State
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/instructor/courses/${courseId}`).then(res => res.json()),
      fetch(`/api/instructor/courses/${courseId}/quizzes`).then(res => res.json()),
      fetch(`/api/instructor/courses/${courseId}/assignments`).then(res => res.json()),
      fetch("/api/categories").then(res => res.json())
    ]).then(([courseData, quizData, assignmentData, catData]) => {
      if (courseData.error) {
        setError(courseData.error);
      } else {
        setCourse(courseData);
        setLessons(courseData.lessons || []);
        setQuizzes(quizData || []);
        setAssignments(assignmentData || []);
      }
      setCategories(catData);
      setIsLoading(false);
    }).catch(err => {
      setError("Failed to load course data");
      setIsLoading(false);
    });
  }, [courseId]);

  const refreshQuizzes = async () => {
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/quizzes`);
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to refresh quizzes", err);
    }
  };

  const handleUpdateCourse = async (e?: React.FormEvent, submitForReview = false) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          categoryId: course.categoryId,
          price: course.price,
          level: course.level,
          isPublished: course.isPublished,
          status: submitForReview ? 2 : course.status
        })
      });
      if (!res.ok) throw new Error("Failed to update course");
      
      const updatedData = await res.json();
      setCourse(updatedData);
      
      if (submitForReview) {
        toast.success("Berhasil!", "Kursus telah diajukan ke admin untuk direview.");
      } else {
        toast.success("Tersimpan", "Perubahan kursus berhasil disimpan.");
      }
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLesson)
      });
      if (!res.ok) throw new Error("Failed to add lesson");
      const addedLesson = await res.json();
      setLessons([...lessons, addedLesson]);
      setIsAddingLesson(false);
      setNewLesson({ title: "", description: "", videoUrl: "", duration: "", isFree: false });
      toast.success("Materi Ditambahkan", `"${addedLesson.title}" berhasil ditambahkan.`);
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLessonConfirmed = async () => {
    if (!confirmDeleteLesson) return;
    const lesson = confirmDeleteLesson;
    setConfirmDeleteLesson(null);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lesson.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete lesson");
      setLessons(lessons.filter(l => l.id !== lesson.id));
      toast.success("Materi Dihapus", "Materi telah dihapus dari silabus.");
    } catch (err: any) {
      toast.error("Gagal", err.message);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Hapus kuis ini?")) return;
    try {
      const res = await fetch(`/api/instructor/quizzes/${quizId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quiz");
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      toast.success("Kuis Dihapus", "Kuis telah dihapus dari kursus.");
    } catch (err: any) {
      toast.error("Gagal", err.message);
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditLessonData({
      title: lesson.title,
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration?.toString() || "",
      isFree: lesson.isFree || false,
    });
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLessonData),
      });
      if (!res.ok) throw new Error("Gagal memperbarui materi");
      const updated = await res.json();
      setLessons(lessons.map(l => (l.id === editingLesson.id ? { ...l, ...updated } : l)));
      setEditingLesson(null);
      toast.success("Materi Diperbarui", `"${updated.title}" berhasil diperbarui.`);
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });
      if (!res.ok) throw new Error("Failed to add assignment");
      const added = await res.json();
      setAssignments([added, ...assignments]);
      setIsAddingAssignment(false);
      setNewAssignment({ title: "", description: "", dueDate: "" });
      toast.success("Tugas Ditambahkan", `"${added.title}" berhasil dibuat.`);
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditAssignmentData({
      title: assignment.title,
      description: assignment.description || "",
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split("T")[0] : "",
    });
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/assignments/${editingAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAssignmentData),
      });
      if (!res.ok) throw new Error("Gagal memperbarui tugas");
      const updated = await res.json();
      setAssignments(assignments.map(a => (a.id === editingAssignment.id ? { ...a, ...updated } : a)));
      setEditingAssignment(null);
      toast.success("Tugas Diperbarui", `"${updated.title}" berhasil diperbarui.`);
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Hapus tugas ini?")) return;
    try {
      const res = await fetch(`/api/instructor/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assignment");
      setAssignments(assignments.filter(a => a.id !== id));
      toast.success("Tugas Dihapus", "Penugasan telah dihapus.");
    } catch (err: any) {
      toast.error("Gagal", err.message);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#FF6B4A]" size={40} /></div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/instructor/courses" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#FF6B4A] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Kelas ✏️</h1>
            <p className="text-slate-400 text-sm font-medium">Kelola informasi kelas dan silabus materi.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
            course.isPublished 
              ? 'bg-green-50 text-green-600 border-green-100' 
              : course.status === 2 
                ? 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}>
            {course.isPublished ? "Status: Published" : course.status === 2 ? "Status: Pending Review" : "Status: Draft"}
          </div>

          {/* Instructor Action: Submit for Review */}
          {!course.isPublished && course.status !== 2 && (
            <Button 
              onClick={() => handleUpdateCourse(undefined, true)}
              disabled={isSaving}
              variant="outline"
              className="rounded-xl h-11 font-black px-6 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-all"
            >
              Submit for Review 🚀
            </Button>
          )}

          <Button 
            onClick={() => handleUpdateCourse()}
            disabled={isSaving}
            className="bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl h-11 px-6 font-black shadow-lg shadow-orange-100 transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Form Informasi Kelas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-800 mb-6">Informasi Dasar</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                   <Type size={12} className="text-[#FF6B4A]" /> Judul Kelas
                </label>
                <input 
                  type="text" 
                  value={course.title}
                  onChange={e => setCourse({...course, title: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all font-bold text-sm text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                   Harga (Rp)
                </label>
                <input 
                  type="number" 
                  value={course.price}
                  onChange={e => setCourse({...course, price: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all font-bold text-sm text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                   Kategori
                </label>
                <select 
                  value={course.categoryId}
                  onChange={e => setCourse({...course, categoryId: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all font-bold text-sm text-slate-700"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                   Level
                </label>
                <select 
                  value={course.level}
                  onChange={e => setCourse({...course, level: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all font-bold text-sm text-slate-700"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                   Deskripsi
                </label>
                <textarea 
                  rows={4}
                  value={course.description}
                  onChange={e => setCourse({...course, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all font-medium text-sm resize-none text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Silabus Materi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Silabus Materi</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Total {lessons.length} video materi</p>
              </div>
              {!isAddingLesson && (
                <Button 
                  onClick={() => setIsAddingLesson(true)}
                  className="bg-orange-50 hover:bg-[#FF6B4A] text-[#FF6B4A] hover:text-white rounded-xl h-11 px-6 font-black transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} /> Tambah Materi
                </Button>
              )}
            </div>

            {/* Form Tambah Materi */}
            {isAddingLesson && (
              <form onSubmit={handleAddLesson} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 mb-8 space-y-6 shadow-inner relative overflow-hidden group/form">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/form:scale-125 transition-transform" />
                
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  <Video size={16} className="text-[#FF6B4A]" /> Materi Baru
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Materi</label>
                  <input type="text" required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Contoh: Pengenalan Dasar-Dasar" className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Globe size={12} /> URL Video (YouTube)
                    </label>
                    <input type="text" value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Clock size={12} /> Durasi (Menit)
                    </label>
                    <input type="number" required value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} placeholder="Misal: 15" className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 outline-none transition-all" />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white w-fit px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <input type="checkbox" id="isFree" checked={newLesson.isFree} onChange={e => setNewLesson({...newLesson, isFree: e.target.checked})} className="w-4 h-4 rounded text-[#FF6B4A] focus:ring-[#FF6B4A]" />
                  <label htmlFor="isFree" className="text-xs font-black text-slate-600">Video Gratis (Preview Saja)</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" onClick={() => setIsAddingLesson(false)} variant="ghost" className="h-12 px-6 rounded-xl font-black text-slate-400">Batal</Button>
                  <Button type="submit" disabled={isSaving} className="h-12 bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl px-8 font-black shadow-lg shadow-orange-100">{isSaving ? 'Menyimpan...' : 'Simpan & Tambahkan'}</Button>
                </div>
              </form>
            )}

            {/* List Materi */}
            <div className="space-y-4">
              {lessons.length === 0 && !isAddingLesson && (
                <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Video size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-400">Belum Ada Materi Pelajaran</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">Mulai susun kurikulum Anda sekarang.</p>
                </div>
              )}
              {lessons.map((lesson, idx) => (
                <div key={lesson.id}>
                  {editingLesson?.id === lesson.id ? (
                    /* ── Inline Edit Form ─── */
                    <form onSubmit={handleUpdateLesson} className="bg-orange-50/50 border-2 border-orange-100 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Edit Materi #{idx + 1}</span>
                        <button type="button" onClick={() => setEditingLesson(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Materi</label>
                        <input type="text" required value={editLessonData.title} onChange={e => setEditLessonData({...editLessonData, title: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Globe size={10} /> URL Video</label>
                          <input type="text" value={editLessonData.videoUrl} onChange={e => setEditLessonData({...editLessonData, videoUrl: e.target.value})} placeholder="https://youtube.com/..." className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Clock size={10} /> Durasi (Menit)</label>
                          <input type="number" required value={editLessonData.duration} onChange={e => setEditLessonData({...editLessonData, duration: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white w-fit px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <input type="checkbox" id={`isFree-${lesson.id}`} checked={editLessonData.isFree} onChange={e => setEditLessonData({...editLessonData, isFree: e.target.checked})} className="w-4 h-4 rounded text-[#FF6B4A]" />
                        <label htmlFor={`isFree-${lesson.id}`} className="text-xs font-black text-slate-600">Video Gratis (Preview)</label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={() => setEditingLesson(null)} variant="ghost" className="h-10 px-5 rounded-xl font-black text-slate-400 text-sm">Batal</Button>
                        <Button type="submit" disabled={isSaving} className="h-10 bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl px-6 font-black text-sm shadow-md shadow-orange-100">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
                      </div>
                    </form>
                  ) : (
                    /* ── Lesson Card ─── */
                    <div className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-slate-100/50 transition-all group relative">
                      <div className="cursor-grab text-slate-300 hover:text-slate-500">
                        <GripVertical size={20} />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B4A] flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                          {lesson.title}
                          {lesson.isFree && <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Preview</span>}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase"><Clock size={10} /> {lesson.duration} Menit</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase"><Video size={10} /> Video</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditLesson(lesson)} className="p-3 text-slate-300 hover:text-[#FF6B4A] hover:bg-orange-50 rounded-2xl transition-all">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setConfirmDeleteLesson(lesson)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Section Kuis */}
            <div className="mt-16 pt-12 border-t border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Kuis Pelajaran 📝</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Uji pemahaman siswa setelah materi selesai.</p>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedLessonId(null);
                    setIsAddingQuiz(true);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl h-11 px-6 font-black transition-all flex items-center gap-2 shadow-sm border border-indigo-100"
                >
                  <Plus size={18} /> Tambah Kuis Umum
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.length === 0 && (
                  <div className="md:col-span-2 text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FileQuestion size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-black text-slate-400">Belum Ada Kuis Aktif</p>
                  </div>
                )}
                {quizzes.map((quiz: any) => (
                  <div key={quiz.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all flex items-center gap-5 group border-b-4 border-b-indigo-50 hover:border-b-indigo-500">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-sm transition-transform group-hover:rotate-12">
                      Q
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-sm leading-tight">{quiz.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                          {quiz._count.questions} Qs
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                          Lulus {quiz.passingScore}%
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteQuiz(quiz.id)} 
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Tugas (Assignments) */}
            <div className="mt-16 pt-12 border-t border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Penugasan (Assignments) 📝</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Berikan tugas proyek atau latihan praktis.</p>
                </div>
                {!isAddingAssignment && (
                  <Button 
                    onClick={() => setIsAddingAssignment(true)}
                    className="bg-orange-50 hover:bg-[#FF6B4A] text-[#FF6B4A] hover:text-white rounded-xl h-11 px-6 font-black transition-all flex items-center gap-2 shadow-sm border border-orange-100"
                  >
                    <Plus size={18} /> Tambah Tugas
                  </Button>
                )}
              </div>

              {/* Form Tambah Tugas */}
              {isAddingAssignment && (
                <form onSubmit={handleAddAssignment} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 mb-8 space-y-6 shadow-inner">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                    <FileText size={16} className="text-[#FF6B4A]" /> Tugas Baru
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Tugas</label>
                      <input type="text" required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Contoh: Proyek Akhir Desain UI/UX" className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                      <input type="date" required value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi & Instruksi</label>
                      <textarea rows={4} value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} placeholder="Jelaskan instruksi tugas secara detail..." className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-50 transition-all resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" onClick={() => setIsAddingAssignment(false)} variant="ghost" className="h-12 px-6 rounded-xl font-black text-slate-400">Batal</Button>
                    <Button type="submit" disabled={isSaving} className="h-12 bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl px-8 font-black shadow-lg shadow-orange-100">Buat Tugas</Button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.length === 0 && !isAddingAssignment && (
                  <div className="md:col-span-2 text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FileText size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-black text-slate-400">Belum Ada Tugas</p>
                  </div>
                )}
                {assignments.map((assignment: any) => (
                  <div key={assignment.id}>
                    {editingAssignment?.id === assignment.id ? (
                      /* ── Inline Edit Form ─── */
                      <form onSubmit={handleUpdateAssignment} className="bg-orange-50/50 border-2 border-orange-100 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Edit Tugas</span>
                          <button type="button" onClick={() => setEditingAssignment(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Tugas</label>
                          <input type="text" required value={editAssignmentData.title} onChange={e => setEditAssignmentData({...editAssignmentData, title: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Calendar size={10} /> Deadline</label>
                          <input type="date" required value={editAssignmentData.dueDate} onChange={e => setEditAssignmentData({...editAssignmentData, dueDate: e.target.value})} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-[#FF6B4A] focus:ring-4 focus:ring-orange-50 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi & Instruksi</label>
                          <textarea rows={3} value={editAssignmentData.description} onChange={e => setEditAssignmentData({...editAssignmentData, description: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-50 transition-all resize-none" />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button type="button" onClick={() => setEditingAssignment(null)} variant="ghost" className="h-10 px-5 rounded-xl font-black text-slate-400 text-sm">Batal</Button>
                          <Button type="submit" disabled={isSaving} className="h-10 bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl px-6 font-black text-sm shadow-md shadow-orange-100">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
                        </div>
                      </form>
                    ) : (
                      /* ── Assignment Card ─── */
                      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all flex items-center gap-5 group border-b-4 border-b-orange-50 hover:border-b-orange-500">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF6B4A] flex items-center justify-center font-black shrink-0 shadow-sm transition-transform group-hover:scale-110">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-slate-800 text-sm leading-tight">{assignment.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Calendar size={10} /> {new Date(assignment.dueDate).toLocaleDateString("id-ID", { day:'2-digit', month:'short' })}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Tugas Proyek</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEditAssignment(assignment)} className="p-2 text-slate-300 hover:text-[#FF6B4A] hover:bg-orange-50 rounded-xl transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Builder Modal */}
      {isAddingQuiz && (
        <QuizBuilder 
          courseId={parseInt(courseId)}
          lessonId={selectedLessonId}
          onClose={() => setIsAddingQuiz(false)}
          onSuccess={() => {
            setIsAddingQuiz(false);
            refreshQuizzes();
          }}
        />
      )}

      {/* Delete Lesson Confirm */}
      <ConfirmDialog
        open={!!confirmDeleteLesson}
        onClose={() => setConfirmDeleteLesson(null)}
        onConfirm={handleDeleteLessonConfirmed}
        variant="danger"
        title="Hapus Materi?"
        description={`Materi "${confirmDeleteLesson?.title}" akan dihapus secara permanen dari silabus kelas ini.`}
        confirmLabel="Ya, Hapus Materi"
      />
    </main>
  );
}
