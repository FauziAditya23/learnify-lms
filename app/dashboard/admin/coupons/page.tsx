"use client";

import React, { useState, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  Percent, 
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    id: 0,
    code: "",
    discountPercent: "",
    maxUses: "100",
    validUntil: "",
    status: 1
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      if (Array.isArray(json)) {
        setCoupons(json);
      } else {
        setCoupons([]);
        if (json.error) toast.error("Gagal", json.error);
      }
    } catch (err) {
      console.error(err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ id: 0, code: "", discountPercent: "", maxUses: "100", validUntil: "", status: 1 });
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setIsEditing(true);
    setFormData({
      id: c.id,
      code: c.code,
      discountPercent: c.discountPercent.toString(),
      maxUses: c.maxUses.toString(),
      validUntil: new Date(c.validUntil).toISOString().split('T')[0],
      status: c.status
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.discountPercent || !formData.validUntil) {
      toast.error("Validasi Gagal", "Harap lengkapi semua field wajib.");
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/admin/coupons/${formData.id}` : "/api/admin/coupons";
      const method = isEditing ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan kupon");
      }
      
      toast.success("Berhasil", isEditing ? "Kupon diperbarui" : "Kupon ditambahkan");
      setIsSheetOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kupon");
      toast.success("Berhasil", "Kupon telah dihapus");
      setConfirmDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal", err.message);
      setConfirmDeleteId(null);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Coupon Management 🏷️
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1">
            Kelola kode diskon untuk meningkatkan konversi penjualan.
          </p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-12 px-6 bg-[#FF6B4A] hover:bg-[#fa5a35] text-white rounded-2xl font-black shadow-lg shadow-orange-100 flex items-center gap-2"
        >
          <Plus size={18} /> Buat Kupon Baru
        </Button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="relative w-full md:w-96 mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari kode kupon..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#FF6B4A]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
             <Tag size={48} className="text-slate-100 mb-2" />
             <p className="text-slate-400 font-bold">Belum ada kupon.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
             <table className="w-full text-sm whitespace-nowrap min-w-[1200px]">
               <thead>
                 <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="text-left pb-4 pl-4 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">Aksi</th>
                    <th className="text-left pb-4 pl-4">Kode Kupon</th>
                    <th className="text-left pb-4 pl-4">Diskon & Penggunaan</th>
                    <th className="text-left pb-4 pl-4">Berlaku S/D</th>
                    <th className="text-left pb-4 pl-4">Status</th>
                    <th className="text-left pb-4 pl-4">Created By</th>
                    <th className="text-left pb-4 pl-4">Created Date</th>
                    <th className="text-left pb-4 pl-4">Last Update By</th>
                    <th className="text-left pb-4 pl-4 pr-4">Last Update Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filtered.map(c => (
                   <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                     {/* Aksi di kiri — sticky */}
                     <td className="py-4 pl-4 pr-6 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#f1f5f9] transition-colors z-10">
                        <div className="flex items-center gap-2">
                           <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 w-8 rounded-lg text-blue-500 border-blue-100 hover:bg-blue-50"
                           >
                             <Edit2 size={14} />
                           </Button>
                           <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setConfirmDeleteId(c.id)}
                            disabled={loadingId === c.id}
                            className="h-8 w-8 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                           >
                             {loadingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                           </Button>
                        </div>
                     </td>

                     <td className="py-4 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-orange-50 text-[#FF6B4A] rounded-xl flex items-center justify-center font-black text-xs uppercase shrink-0">
                            <Tag size={14} />
                          </div>
                          <p className="font-black text-slate-800 uppercase tracking-wider text-xs">{c.code}</p>
                        </div>
                     </td>

                     <td className="py-4 pl-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 font-bold text-green-600 text-xs">
                            <Percent size={12} /> {c.discountPercent}% OFF
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-tight">
                            <Users size={10} /> {c.usedCount} / {c.maxUses} TERPAKAI
                          </div>
                        </div>
                     </td>

                     <td className="py-4 pl-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                          <Calendar size={14} className="text-slate-300" /> {new Date(c.validUntil).toLocaleDateString("id-ID", { day:'2-digit', month:'short', year:'numeric' })}
                        </div>
                     </td>

                     <td className="py-4 pl-4">
                        {c.status === 1 ? (
                          <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-green-100">Aktif</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-slate-200">Nonaktif</span>
                        )}
                     </td>

                     {/* 4 Field Standar */}
                     <td className="py-4 pl-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {c.createdBy || "SYSTEM"}
                        </span>
                     </td>
                     <td className="py-4 pl-4 text-slate-500 font-medium text-[10px]">
                        {formatDate(c.createdDate)}
                     </td>
                     <td className="py-4 pl-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {c.lastUpdatedBy || "SYSTEM"}
                        </span>
                     </td>
                     <td className="py-4 pl-4 pr-4 text-slate-500 font-medium text-[10px]">
                        {formatDate(c.lastUpdatedDate)}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      <Modal
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={isEditing ? "Edit Kupon" : "Buat Kupon Baru"}
        description="Konfigurasi detail diskon dan masa berlaku kupon."
      >
        <div className="space-y-6">
           <div className="space-y-2">
             <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Kode Kupon</Label>
             <Input 
              placeholder="CONTOH: DISKON50" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              className="h-12 rounded-xl border-slate-100 uppercase font-bold"
             />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Persen Diskon (%)</Label>
               <Input 
                type="number" 
                placeholder="50" 
                value={formData.discountPercent} 
                onChange={e => setFormData({...formData, discountPercent: e.target.value})}
                className="h-12 rounded-xl border-slate-100 font-bold"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Maks Penggunaan</Label>
               <Input 
                type="number" 
                placeholder="100" 
                value={formData.maxUses} 
                onChange={e => setFormData({...formData, maxUses: e.target.value})}
                className="h-12 rounded-xl border-slate-100 font-bold"
               />
             </div>
           </div>

           <div className="space-y-2">
             <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Berlaku Sampai</Label>
             <Input 
              type="date" 
              value={formData.validUntil} 
              onChange={e => setFormData({...formData, validUntil: e.target.value})}
              className="h-12 rounded-xl border-slate-100 font-bold"
             />
           </div>

           <div className="space-y-2">
             <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Status</Label>
             <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: Number(e.target.value)})}
              className="w-full h-12 rounded-xl border border-slate-100 px-3 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-100"
             >
               <option value={1}>Aktif (Dapat Digunakan)</option>
               <option value={0}>Nonaktif (Ditangguhkan)</option>
             </select>
           </div>

           <div className="pt-4 flex gap-3">
             <Button 
               variant="outline"
               onClick={() => setIsSheetOpen(false)}
               className="flex-1 h-12 rounded-xl font-bold"
             >
               Batal
             </Button>
             <Button 
               onClick={handleSave} 
               disabled={isSaving}
               className="flex-1 h-12 bg-[#FF6B4A] hover:bg-[#fa5a35] text-white rounded-xl font-black shadow-lg shadow-orange-500/20"
             >
               {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
               Simpan Kupon
             </Button>
           </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        title="Hapus Kupon"
        description="Apakah Anda yakin ingin menghapus kupon ini? Kode ini tidak akan bisa digunakan lagi."
        variant="danger"
        isLoading={loadingId !== null && loadingId === confirmDeleteId}
      />
    </main>
  );
}
