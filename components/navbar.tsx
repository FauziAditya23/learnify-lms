"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Kursus" },
  { href: "/about", label: "Tentang Kami" },
  { href: "/contact", label: "Hubungi Kami" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100 transition-shadow duration-300 ${
          scrolled ? "shadow-md shadow-slate-100" : ""
        }`}
      >
        <div className="h-[68px] px-4 sm:px-6 md:px-10 flex items-center justify-between max-w-[1440px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-[#FF6B4A] to-[#ff8e75] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 transition-transform group-hover:rotate-12">
              <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800">
              Learnify<span className="text-[#FF6B4A]">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-8 text-[14px] font-semibold text-slate-600">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[#FF6B4A] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Icon */}
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors hidden sm:block">
              <Search className="h-5 w-5" />
            </button>

            {/* Shopping Cart */}
            <div className="relative group cursor-pointer p-2">
              <ShoppingCart className="h-5 w-5 text-slate-400 group-hover:text-[#FF6B4A] transition-colors" />
              <span className="absolute top-0 right-0 bg-[#FF6B4A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                0
              </span>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="h-6 w-[1px] bg-slate-200 mx-1" />
              <Link
                href="/auth/login"
                className="px-4 py-2 text-[13px] font-bold text-slate-600 border border-slate-200 rounded-full hover:text-[#FF6B4A] hover:border-[#FF6B4A] hover:bg-orange-50 transition-all duration-300 shadow-sm"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-[13px] font-bold text-white bg-[#FF6B4A] rounded-full hover:bg-[#e55a3d] transition-all duration-300 shadow-sm shadow-orange-200"
              >
                Daftar
              </Link>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[201] h-full w-[85vw] max-w-[340px] bg-white shadow-2xl xl:hidden flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-[#FF6B4A] to-[#ff8e75] rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">
              Learnify<span className="text-[#FF6B4A]">.</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-orange-50 hover:text-[#FF6B4A] transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer Auth Buttons */}
        <div className="p-5 border-t border-slate-100 space-y-3">
          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-full py-3 text-[14px] font-bold text-slate-600 border border-slate-200 rounded-xl hover:text-[#FF6B4A] hover:border-[#FF6B4A] transition-all"
          >
            Masuk
          </Link>
          <Link
            href="/auth/register"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-full py-3 text-[14px] font-bold text-white bg-[#FF6B4A] rounded-xl hover:bg-[#e55a3d] transition-all shadow-md shadow-orange-200"
          >
            Daftar Sekarang
          </Link>
        </div>
      </aside>
    </>
  );
}