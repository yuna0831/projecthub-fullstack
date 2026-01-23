"use client";

import Link from "next/link";
import { useAuth } from "../context/UserContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      {/* 왼쪽 로고 */}
      <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition">
        ProjectHub
      </Link>

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
            <NotificationBell />
            <Link href="/profile" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Profile
            </Link>
            <button
              onClick={logout}
              className="text-sm px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => login("google")}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
              <span>G</span> Google
            </button>
            <button
              onClick={() => login("github")}
              className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
              <span>🐙</span> GitHub
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}
