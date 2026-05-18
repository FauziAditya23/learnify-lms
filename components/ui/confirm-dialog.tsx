"use client";

import React from "react";
import { AlertTriangle, Trash2, ShieldOff, Loader2, X, CheckCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ConfirmVariant = "danger" | "warning" | "success";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: ConfirmVariant;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const VARIANT_CONFIG = {
  danger: {
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    icon: <Trash2 className="w-6 h-6" />,
    btnClass: "bg-red-500 hover:bg-red-600 shadow-red-100",
    defaultLabel: "Hapus",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    icon: <ShieldOff className="w-6 h-6" />,
    btnClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-100",
    defaultLabel: "Nonaktifkan",
  },
  success: {
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    icon: <CheckCircle className="w-6 h-6" />,
    btnClass: "bg-green-500 hover:bg-green-600 shadow-green-100",
    defaultLabel: "Aktifkan",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  variant = "danger",
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const label = confirmLabel ?? config.defaultLabel;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-300/40 w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className={`w-14 h-14 ${config.iconBg} ${config.iconColor} rounded-2xl flex items-center justify-center mb-5`}>
            {config.icon}
          </div>

          {/* Text */}
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>

          {/* Warning note */}
          <div className="flex items-start gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-12 text-white rounded-xl font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${config.btnClass}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              config.icon
            )}
            {isLoading ? "Memproses..." : label}
          </button>
        </div>
      </div>
    </div>
  );
}
