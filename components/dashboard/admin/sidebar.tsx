"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  Wallet,
  Activity,
  QrCode,
  ShieldCheck,
  LogOut,
  Tags,
  Banknote,
  Tag,
  Medal,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  userName: string;
  pendingCount?: number;
  pendingPayoutCount?: number;
  onEnable2FA?: () => void;
}

const NAV_ITEMS = [
  {
    name: "Main Console",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Course Approvals",
    href: "/dashboard/admin/courses/approvals",
    icon: ShieldCheck,
    badge: "pending",
  },
  {
    name: "Manage Students",
    href: "/dashboard/admin/students",
    icon: GraduationCap,
    badge: null,
  },
  {
    name: "Manage Instructors",
    href: "/dashboard/admin/instructors",
    icon: UserCheck,
    badge: null,
  },
  {
    name: "Course Revenues",
    href: "/dashboard/admin/revenues",
    icon: Wallet,
    badge: null,
  },
  {
    name: "System Activity",
    href: "/dashboard/admin/logs",
    icon: Activity,
    badge: null,
  },
  {
    name: "Master Categories",
    href: "/dashboard/admin/categories",
    icon: Tags,
    badge: null,
  },
  {
    name: "Payout Moderation",
    href: "/dashboard/admin/payouts",
    icon: Banknote,
    badge: "payout",
  },
  {
    name: "Manage Coupons",
    href: "/dashboard/admin/coupons",
    icon: Tag,
    badge: null,
  },
  {
    name: "System Badges",
    href: "/dashboard/admin/badges",
    icon: Medal,
    badge: null,
  },
] as const;

// Show first 4 items on mobile bottom nav + 1 'More' button (Total: 5 items - Industry Standard)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export default function AdminSidebar({
  userName,
  pendingCount = 0,
  pendingPayoutCount = 0,
  onEnable2FA,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("admin-sidebar-collapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/sign-out";
  };

  const SidebarContent = ({ onClose, collapsed = false }: { onClose?: () => void, collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`p-6 flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3 transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-xl font-black tracking-tighter block text-[#2D2D2D] truncate">
                Learnify.
              </span>
              <span className="text-[10px] font-bold text-orange-600 tracking-[1.5px] uppercase leading-none truncate block">
                Super Admin
              </span>
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors xl:hidden shrink-0"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "px-3" : "px-5"}`}>
        {!collapsed ? (
          <p className="px-4 text-[9px] font-black text-slate-300 uppercase tracking-[2px] mb-2 mt-2">
            Monitoring System
          </p>
        ) : (
          <div className="h-6" /> // spacer
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          let count = 0;
          if (item.badge === "pending") count = pendingCount;
          if (item.badge === "payout") count = pendingPayoutCount;

          const showBadge = count > 0;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-xl font-bold text-[13px] transition-all ${
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-400 hover:bg-orange-50/50 hover:text-orange-600"
                  } ${collapsed ? "justify-center px-0" : "px-4"}`}
                >
                  <item.icon
                    size={20}
                    className={isActive ? "text-orange-600 shrink-0" : "text-slate-300 shrink-0"}
                  />
                  {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                  {!collapsed && showBadge && (
                    <span className="min-w-[22px] h-[22px] bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-orange-200 animate-pulse shrink-0">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                  {collapsed && showBadge && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse border border-white" />
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={14} className="bg-[#2D2D2D] text-white border-none font-bold shadow-xl hidden xl:block">
                  {item.name}
                  {showBadge && ` (${count})`}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* 2FA Button */}
        {onEnable2FA && (
          <div className="pt-2 border-t border-slate-50 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onEnable2FA}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-xl font-bold text-[13px] text-slate-400 hover:bg-green-50 hover:text-green-600 transition-all ${
                    collapsed ? "justify-center px-0" : "px-4"
                  }`}
                >
                  <QrCode size={20} className="text-slate-300 shrink-0" />
                  {!collapsed && <span className="truncate">2FA Security</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={14} className="bg-[#2D2D2D] text-white border-none font-bold shadow-xl hidden xl:block">
                  2FA Security
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </nav>
      </TooltipProvider>

      {/* User Card */}
      <div className={`m-3 bg-orange-50/50 rounded-[1.5rem] border border-orange-100 transition-all duration-300 ${collapsed ? "p-2 flex flex-col gap-2 items-center" : "p-4"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "mb-3"}`}>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-orange-600 shadow-sm border border-orange-100 text-[10px] shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-[#2D2D2D] truncate">{userName}</p>
              <p className="text-[9px] text-orange-500 font-bold truncate italic uppercase tracking-tighter">
                Administrator
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-orange-100 rounded-lg font-black transition-all shadow-sm ${
            collapsed ? "w-8 h-8 p-0" : "w-full py-2.5 text-[11px]"
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={16} className="shrink-0" /> {!collapsed && <span>Sign Out Panel</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`bg-white hidden xl:flex flex-col sticky top-0 h-screen border-r border-orange-50 transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-orange-100 rounded-full flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 shadow-sm z-50 transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="xl:hidden sticky top-0 z-50 bg-white border-b border-orange-50 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="text-base font-black tracking-tighter text-[#2D2D2D]">
            Learnify. <span className="text-[9px] text-orange-500 font-bold uppercase tracking-widest">Admin</span>
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-orange-50 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ===== MOBILE DRAWER OVERLAY ===== */}
      {drawerOpen && (
        <div
          className="xl:hidden fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ===== MOBILE DRAWER ===== */}
      <aside
        className={`xl:hidden fixed top-0 left-0 z-[201] h-full w-[85vw] max-w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} collapsed={false} />
      </aside>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-50 flex items-center justify-around px-2 h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          let count = 0;
          if (item.badge === "pending") count = pendingCount;
          if (item.badge === "payout") count = pendingPayoutCount;
          const showBadge = count > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 relative min-w-[40px] py-1.5 px-2 rounded-xl transition-all ${
                isActive ? "text-orange-600" : "text-slate-300 hover:text-orange-500"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-bold leading-none truncate">{item.name.split(" ")[0]}</span>
              {showBadge && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-[3px] bg-orange-500 rounded-b-full" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 min-w-[40px] py-1.5 px-2 rounded-xl text-slate-300 hover:text-orange-500 transition-all"
        >
          <Menu size={20} />
          <span className="text-[9px] font-bold leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
