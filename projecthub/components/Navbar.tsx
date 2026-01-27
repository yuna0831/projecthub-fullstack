"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/UserContext";
import NotificationBell from "./NotificationBell";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      {/* Search Bar / Left Logo */}
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent hover:opacity-80 transition">
          MadCollab
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

        {user ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-[#c5050c] transition">
              Dashboard
            </Link>
            <Link href="/profile" className="text-sm font-medium text-slate-600 hover:text-[#c5050c] transition">
              Profile
            </Link>
            <NotificationBell />
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
