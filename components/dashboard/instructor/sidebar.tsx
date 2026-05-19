"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Video,
  Settings,
  LogOut,
  BookOpenCheck,
  TrendingUp,
  MessageSquare,
  FileText,
  Plus,
  User,
  Star,
  Megaphone,
  Coins,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface InstructorSidebarProps {
  userName: string;
}

const NAV_ITEMS = [
  { name: "Dashboard",      href: "/dashboard/instructor",              icon: LayoutDashboard },
  { name: "My Courses",     href: "/dashboard/instructor/courses",      icon: BookOpenCheck },
  { name: "Students",       href: "/dashboard/instructor/students",     icon: Users },
  { name: "Assignments",    href: "/dashboard/instructor/assignments",  icon: FileText },
  { name: "Reviews",        href: "/dashboard/instructor/reviews",      icon: Star },
  { name: "Discussions",    href: "/dashboard/instructor/messages",     icon: MessageSquare },
  { name: "Announcements",  href: "/dashboard/instructor/announcements",icon: Megaphone },
  { name: "Analytics",      href: "/dashboard/instructor/analytics",    icon: TrendingUp },
  { name: "Financial",      href: "/dashboard/instructor/financial",     icon: Coins },
  { name: "Live Sessions",  href: "/dashboard/instructor/live",         icon: Video },
  { name: "Profile",        href: "/dashboard/settings/profile",        icon: User },
  { name: "Security",       href: "/dashboard/settings/security",       icon: Settings },
] as const;

// Show first 4 items on mobile bottom nav + 1 'More' button (Total: 5 items - Industry Standard)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export default function InstructorSidebar({ userName }: InstructorSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("instructor-sidebar-collapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("instructor-sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/sign-out";
  };

  const SidebarContent = ({ onClose, collapsed = false }: { onClose?: () => void, collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`p-6 flex items-center ${collapsed ? "justify-center" : "justify-between"} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6B4A] rounded-lg flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
            <div className="w-3 h-3 bg-white rounded-sm rotate-45" />
          </div>
          {!collapsed && (
            <span className="text-xl font-black tracking-tighter text-slate-800 truncate">
              Learnify.{" "}
              <span className="text-[9px] bg-orange-50 text-[#FF6B4A] px-2 py-0.5 rounded-full ml-1 font-bold">
                PRO
              </span>
            </span>
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

      {/* Primary CTA */}
      <TooltipProvider delayDuration={0}>
      <div className={`px-6 mb-3 ${collapsed ? "px-3" : "px-6"}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                router.push("/dashboard/instructor/courses/create");
                onClose?.();
              }}
              className={`w-full bg-[#FF6B4A] hover:bg-[#e55a3d] text-white rounded-xl flex items-center justify-center h-10 text-[13px] font-black shadow-lg shadow-orange-100 transition-all hover:-translate-y-0.5 ${
                collapsed ? "p-0" : "gap-2"
              }`}
            >
              <Plus size={16} className="shrink-0" />
              {!collapsed && <span>Create New Course</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={14} className="bg-[#2D2D2D] text-white border-none font-bold shadow-xl hidden xl:block">
              Create New Course
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "px-3" : "px-4"}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 py-2 rounded-xl font-bold text-[13px] transition-all duration-200 ${
                    isActive
                      ? "bg-[#FF6B4A] text-white shadow-lg shadow-orange-100"
                      : "text-slate-400 hover:bg-orange-50 hover:text-[#FF6B4A]"
                  } ${collapsed ? "justify-center px-0" : "px-4"}`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={14} className="bg-[#2D2D2D] text-white border-none font-bold shadow-xl hidden xl:block">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
      </TooltipProvider>

      {/* User Profile + Logout */}
      <div className={`m-3 bg-slate-50 rounded-2xl transition-all duration-300 ${collapsed ? "p-2 flex flex-col gap-2 items-center mx-2 mb-2" : "p-3 mx-4 mb-4"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "mb-2.5"}`}>
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-orange-100 shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`}
              alt="Instructor avatar"
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-slate-800 truncate">{userName}</p>
              <p className="text-[9px] text-[#FF6B4A] font-bold uppercase tracking-wider">
                Instructor
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center gap-2 bg-white text-slate-400 hover:text-red-500 border border-slate-100 rounded-lg font-bold transition-colors ${
            collapsed ? "w-8 h-8 p-0" : "w-full py-2 text-[11px]"
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={14} className="shrink-0" /> {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`bg-white border-r border-slate-100 hidden xl:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "w-[88px]" : "w-[260px]"
        }`}
      >
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#FF6B4A] hover:bg-orange-50 shadow-sm z-50 transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="xl:hidden sticky top-0 z-50 bg-white border-b border-slate-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#FF6B4A] rounded-lg flex items-center justify-center shadow-md shadow-orange-200">
            <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-base font-black tracking-tighter text-slate-800">
            Learnify. <span className="text-[9px] bg-orange-50 text-[#FF6B4A] px-1.5 py-0.5 rounded-full font-bold">PRO</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/instructor/courses/create")}
            className="bg-[#FF6B4A] hover:bg-[#e55a3d] text-white text-[11px] font-black h-8 px-3 rounded-lg shadow-md shadow-orange-100 hidden sm:flex"
          >
            <Plus size={13} /> Buat Kursus
          </Button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:bg-orange-50 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
        </div>
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
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex items-center justify-around px-2 h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 relative min-w-[40px] py-1.5 px-2 rounded-xl transition-all ${
                isActive ? "text-[#FF6B4A]" : "text-slate-300 hover:text-[#FF6B4A]"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-bold leading-none truncate">{item.name.split(" ")[0]}</span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-[3px] bg-[#FF6B4A] rounded-b-full" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 min-w-[40px] py-1.5 px-2 rounded-xl text-slate-300 hover:text-[#FF6B4A] transition-all"
        >
          <Menu size={20} />
          <span className="text-[9px] font-bold leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
