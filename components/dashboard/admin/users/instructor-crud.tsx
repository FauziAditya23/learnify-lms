"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search, Loader2, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";

interface InstructorRow {
  id: string;
  name: string;
  email: string;
  courseCount: number;
  studentCount: number;
  avgRating: number;
  status: number; // 1 active, 0 inactive
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

export default function InstructorCRUD({ initialData }: { initialData: InstructorRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [instructors, setInstructors] = useState<InstructorRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Separate confirm dialogs
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", email: "", status: 1 });

  const filteredInstructors = instructors.filter((ins) =>
    ins.name.toLowerCase().includes(search.toLowerCase()) ||
    ins.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ id: "", name: "", email: "", status: 1 });
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (ins: InstructorRow) => {
    setIsEditing(true);
    setFormData({ id: ins.id, name: ins.name, email: ins.email, status: ins.status });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Validasi Gagal", "Nama dan Email wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const url = isEditing ? `/api/admin/users/${formData.id}` : `/api/admin/users`;
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing ? formData : { ...formData, roleId: 2 };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");

      toast.success("Berhasil", `Instruktur berhasil ${isEditing ? "diperbarui" : "ditambahkan"}`);
      setIsSheetOpen(false);
      router.refresh();

      if (isEditing) {
        setInstructors(instructors.map(ins => ins.id === data.user.id ? {
          ...ins, ...data.user, lastUpdatedDate: new Date().toISOString(),
        } : ins));
      } else {
        setInstructors([{
          ...data.user, courseCount: 0, studentCount: 0, avgRating: 0,
          createdDate: new Date().toISOString(), lastUpdatedDate: new Date().toISOString(),
        }, ...instructors]);
      }
    } catch (error: any) {
      toast.error("Gagal", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle nonaktif/aktif — tetap ada di list, tidak hapus DB
  const handleToggleDeactivate = async () => {
    if (!confirmDeactivateId) return;
    const id = confirmDeactivateId;
    const ins = instructors.find(i => i.id === id)!;
    const newStatus = ins.status === 1 ? 0 : 1;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status akun");

      const { user: updated } = await res.json();
      setInstructors(instructors.map(i => i.id === id
        ? { ...i, status: updated.status, lastUpdatedDate: new Date().toISOString() }
        : i));
      toast.success("Berhasil", newStatus === 0
        ? "Akun instruktur telah dinonaktifkan."
        : "Akun instruktur telah diaktifkan kembali.");
      setConfirmDeactivateId(null);
      router.refresh();
    } catch (error: any) {
      toast.error("Gagal", error.message);
      setConfirmDeactivateId(null);
    } finally {
      setLoadingId(null);
    }
  };

  // Hapus PERMANEN dari DB
  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus instruktur");
      }

      toast.success("Berhasil", "Akun instruktur telah dihapus permanen dari database.");
      setInstructors(instructors.filter(i => i.id !== id));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (error: any) {
      toast.error("Gagal", error.message);
      setConfirmDeleteId(null);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama atau email instruktur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all text-sm font-medium"
          />
        </div>
        <Button
          onClick={handleOpenAdd}
          className="w-full md:w-auto bg-[#FF6B4A] hover:bg-[#E55A3B] text-white rounded-2xl px-6 py-6 font-bold shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5 mr-2" /> Tambah Instruktur
        </Button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm whitespace-nowrap min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">Aksi</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil Instruktur</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kursus / Siswa / Rating</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created Date</th>
              <th className="text-left pb-3 pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update By</th>
              <th className="text-left pb-3 pl-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredInstructors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada data instruktur yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredInstructors.map((ins) => (
                <tr key={ins.id} className={`hover:bg-slate-50/50 transition-colors group ${ins.status === 0 ? "opacity-60" : ""}`}>
                  {/* Aksi — sticky */}
                  <td className="py-3 pl-3 pr-4 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#f1f5f9] transition-colors z-10">
                    <div className="flex items-center gap-1.5">
                      {/* Edit */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-blue-500 border-blue-100 hover:bg-blue-50"
                        onClick={() => handleOpenEdit(ins)}
                        title="Edit data instruktur"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {/* Nonaktifkan / Aktifkan */}
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-7 w-7 rounded-lg ${ins.status === 1
                          ? "text-amber-500 border-amber-100 hover:bg-amber-50"
                          : "text-green-500 border-green-100 hover:bg-green-50"}`}
                        onClick={() => setConfirmDeactivateId(ins.id)}
                        disabled={loadingId === ins.id}
                        title={ins.status === 1 ? "Nonaktifkan akun" : "Aktifkan kembali"}
                      >
                        {loadingId === ins.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : ins.status === 1
                            ? <Ban className="w-3.5 h-3.5" />
                            : <CheckCircle className="w-3.5 h-3.5" />}
                      </Button>
                      {/* Hapus Permanen */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                        onClick={() => setConfirmDeleteId(ins.id)}
                        disabled={loadingId === ins.id}
                        title="Hapus permanen dari database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>

                  {/* Profil */}
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                        {ins.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-xs">{ins.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{ins.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-3 pl-3">
                    <div className="flex flex-col gap-0.5 text-[10px] font-bold">
                      <span className="text-slate-600">📚 {ins.courseCount} kursus · 👤 {ins.studentCount.toLocaleString("id-ID")} siswa</span>
                      <span className="text-yellow-500">⭐ {ins.avgRating > 0 ? ins.avgRating.toFixed(1) : "—"}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 pl-3">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      ins.status === 1 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {ins.status === 1 ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  {/* Audit Fields */}
                  <td className="py-3 pl-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {ins.createdBy || "SYSTEM"}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-slate-500 font-medium text-[10px]">{formatDate(ins.createdDate)}</td>
                  <td className="py-3 pl-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {ins.lastUpdatedBy || "SYSTEM"}
                    </span>
                  </td>
                  <td className="py-3 pl-3 pr-4 text-slate-500 font-medium text-[10px]">{formatDate(ins.lastUpdatedDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      <Modal
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={isEditing ? "Edit Instruktur" : "Tambah Instruktur Baru"}
        description={
          isEditing
            ? "Ubah data profil instruktur di bawah ini."
            : "Daftarkan instruktur baru secara manual. Mereka dapat login menggunakan Google atau mengatur password sendiri."
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all text-sm font-medium"
              placeholder="Contoh: Dr. Budi Santoso"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Email Utama</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all text-sm font-medium"
              placeholder="instruktur@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Status Akun</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF6B4A] focus:ring-2 focus:ring-orange-50 transition-all text-sm font-medium"
            >
              <option value={1}>Aktif (Dapat Membuat Kursus)</option>
              <option value={0}>Nonaktif (Diblokir)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1 rounded-xl font-bold h-12">Batal</Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1 h-12 bg-[#FF6B4A] hover:bg-[#E55A3B] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Simpan Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm: Nonaktifkan / Aktifkan */}
      {confirmDeactivateId && (() => {
        const target = instructors.find(i => i.id === confirmDeactivateId);
        const isActive = target?.status === 1;
        return (
          <ConfirmDialog
            open={true}
            onClose={() => setConfirmDeactivateId(null)}
            onConfirm={handleToggleDeactivate}
            title={isActive ? "Nonaktifkan Instruktur?" : "Aktifkan Kembali Instruktur?"}
            description={
              isActive
                ? `Akun "${target?.name}" akan dinonaktifkan. Mereka tidak dapat login dan akan mendapat pesan "Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut." Data dan kursus tidak dihapus.`
                : `Akun "${target?.name}" akan diaktifkan kembali. Mereka dapat login dan mengelola kursus seperti biasa.`
            }
            variant={isActive ? "warning" : "success"}
            confirmLabel={isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan Kembali"}
            isLoading={loadingId === confirmDeactivateId}
          />
        );
      })()}

      {/* Confirm: Hapus Permanen */}
      {confirmDeleteId && (() => {
        const target = instructors.find(i => i.id === confirmDeleteId);
        return (
          <ConfirmDialog
            open={true}
            onClose={() => setConfirmDeleteId(null)}
            onConfirm={handleDeleteConfirmed}
            title="Hapus Instruktur Permanen?"
            description={`Data akun "${target?.name}" akan dihapus PERMANEN dari database. Tindakan ini tidak dapat dibatalkan. Kursus yang dibuat instruktur ini juga akan terpengaruh.`}
            variant="danger"
            confirmLabel="Ya, Hapus Permanen"
            isLoading={loadingId === confirmDeleteId}
          />
        );
      })()}
    </div>
  );
}
