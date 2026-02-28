"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/UserContext";
import NotificationBell from "./NotificationBell";
import AuthModal from "./AuthModal";
import Avatar from "./Avatar"; // 🆕

export default function Navbar() {
  const { user, login, logout, loading } = useAuth(); // 🆕
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      {/* Search Bar / Left Logo */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-1 group mt-0.5">
          {/* Transparent container focusing only on the red handshake area */}
          <div className="w-14 h-14 overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center">
            {/* Scaled up heavily. Translate-y set to 0 to move it slightly back up from previous downward push. */}
            <img
              src="/hero-image.png"
              alt="MadCollab Logo"
              className="w-full h-full object-cover scale-[2.5] object-center mix-blend-multiply"
            />
          </div>
          <span className="text-3xl font-black tracking-tight text-[#c5050c] group-hover:opacity-80 transition pb-0.5">
            MadCollab
          </span>
        </Link>
      </div>

      {/* 오른쪽 메뉴 */}
      <div className="flex gap-6 items-center">
        <Link href="/find" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
          Join a Project
        </Link>
        <Link href="/post" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
          Recruit Now
        </Link>

        {loading ? (
          <div className="w-20 h-9 bg-slate-100 rounded-full animate-pulse"></div>
        ) : user ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-[#c5050c] transition">
              Dashboard
            </Link>
            <NotificationBell />
            <Link href="/profile">
              <Avatar name={user.displayName} id={user.uid} size="sm" className="hover:ring-2 ring-offset-2 ring-[#c5050c] transition cursor-pointer" />
            </Link>
            <button
              onClick={logout}
              className="text-sm px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="bg-[#c5050c] text-white px-5 py-2 rounded-full hover:bg-red-700 font-bold transition shadow-md shadow-red-900/10"
          >
            Log In
          </button>
        )}
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  );
}
