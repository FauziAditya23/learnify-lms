"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Video,
  Download,
  Settings,
  LogOut,
  Search,
  Sparkles,
  MessageSquare,
  Heart,
  Trophy,
  Receipt,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface StudentSidebarProps {
  userName: string;
}

const NAV_ITEMS = [
  { name: "Dashboard",   href: "/dashboard/student",             icon: LayoutDashboard },
  { name: "Cari Kursus", href: "/dashboard/student/explore",       icon: Sparkles },
  { name: "Leaderboard", href: "/dashboard/student/leaderboard",    icon: Trophy },
  { name: "Discussions", href: "/dashboard/student/discussions",   icon: MessageSquare },
  { name: "Assignments", href: "/dashboard/student/assignments",  icon: FileText },
  { name: "Schedule",    href: "/dashboard/student/schedule",     icon: Calendar },
  { name: "Recordings",  href: "/dashboard/student/recordings",   icon: Video },
  { name: "Resources",   href: "/dashboard/student/resources",    icon: Download },
  { name: "Wishlist",    href: "/dashboard/student/wishlist",     icon: Heart },
  { name: "Purchases",   href: "/dashboard/student/purchases",    icon: Receipt },
  { name: "Settings",    href: "/dashboard/settings/security",    icon: Settings },
] as const;

// Show first 4 items on mobile bottom nav + 1 'More' button (Total: 5 items - Industry Standard)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export default function StudentSidebar({ userName }: StudentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("student-sidebar-collapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("student-sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/sign-out";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/dashboard/student/explore?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setDrawerOpen(false);
  };

  const SidebarContent = ({ onClose, collapsed = false }: { onClose?: () => void, collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`p-6 flex items-center ${collapsed ? "justify-center" : "justify-between"} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6B4A] rounded-lg flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
            <div className="w-3 h-3 bg-white rounded-sm rotate-45" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-slate-800 truncate">
              Learnify
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

      {/* Search Bar */}
      <TooltipProvider delayDuration={0}>
      <div className={`mb-3 ${collapsed ? "px-3" : "px-5"}`}>
        <Tooltip>
          <form onSubmit={handleSearch} className="relative">
            {collapsed ? (
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="w-full h-9 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Search size={16} />
                </button>
              </TooltipTrigger>
            ) : (
              <>
                <Search
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-8 pr-4 h-9 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all placeholder:text-slate-300"
                />
              </>
            )}
          </form>
          {collapsed && (
            <TooltipContent side="right" sideOffset={14} className="bg-[#2D2D2D] text-white border-none font-bold shadow-xl hidden xl:block">
              Search
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "px-3" : "px-4"}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 py-2 rounded-xl font-semibold text-[13px] transition-all ${
                    isActive
                      ? "bg-[#FF6B4A] text-white shadow-md shadow-orange-100"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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
              alt="Student avatar"
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-slate-800 truncate">
                {userName}
              </p>
              <p className="text-[9px] text-[#FF6B4A] font-bold uppercase tracking-wider">
                Student
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
          <div className="w-7 h-7 bg-[#FF6B4A] rounded-lg flex items-center justify-center shadow-md shadow-orange-100">
            <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-800">Learnify</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline search for mobile */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kursus..."
              className="w-40 pl-7 pr-3 h-8 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300"
            />
          </form>
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
              <span className="text-[9px] font-bold leading-none truncate max-w-[44px] text-center">{item.name.split(" ")[0]}</span>
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
