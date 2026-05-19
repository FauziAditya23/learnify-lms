"use client";

import React, { useState } from "react";
import AdminSidebar from "./sidebar";
import { authClient } from "@/lib/auth-client";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import QRCodeLib from 'qrcode';

export default function AdminLayoutContent({ 
  children, 
  userName,
  pendingCount = 0,
  pendingPayoutCount = 0,
}: { 
  children: React.ReactNode; 
  userName: string;
  pendingCount?: number;
  pendingPayoutCount?: number;
}) {
  const toast = useToast();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleEnable2FA = async () => {
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: "" 
      });

      if (data && data.totpURI) {
        const generatedQr = await QRCodeLib.toDataURL(data.totpURI);
        setQrCodeImage(generatedQr);
        setShow2FAModal(true);
      } else {
        console.error(error);
        toast.error("Gagal", "Gagal mengambil data 2FA.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Terjadi kesalahan sistem.");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const { data, error } = await (authClient.twoFactor as any).verifyOtp({
        code: twoFactorCode
      });

      if (data) {
        toast.success("Berhasil", "Mantap Zi! 2FA Berhasil Aktif.");
        setShow2FAModal(false);
        setTwoFactorCode("");
      } else {
        console.error(error);
        toast.error("Gagal", "Kode salah atau kadaluwarsa!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal", "Gagal verifikasi.");
    }
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-[#FFFBF9] font-sans text-[#2D2D2D]">
      <AdminSidebar 
        userName={userName} 
        pendingCount={pendingCount} 
        pendingPayoutCount={pendingPayoutCount}
        onEnable2FA={handleEnable2FA} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-16 xl:pb-0">
        {children}
      </div>

      {/* --- MODAL 2FA OVERLAY --- */}
      {show2FAModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-orange-100 relative text-center">
            <button onClick={() => setShow2FAModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-orange-500">
              <X size={24} />
            </button>
            
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">Setup 2FA Security</h3>
            <p className="text-slate-400 text-xs font-bold mb-6">Scan QR di bawah dengan Google Authenticator</p>
            
            <div className="bg-orange-50 p-4 rounded-3xl inline-block mb-6 border-2 border-orange-100">
              {qrCodeImage && <img src={qrCodeImage} alt="QR Code" className="w-48 h-48" />}
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="000000"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.3em] focus:ring-2 focus:ring-orange-500 outline-none"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
              />
              <Button onClick={handleVerify2FA} className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 border-none">
                Verifikasi Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
