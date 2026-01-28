/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/UserContext";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { login, loginWithEmail, signupWithEmail } = useAuth();
    const [mode, setMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // 🔒 Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "LOGIN") {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password, name);
            }
            onClose();
            alert("Success!");
        } catch (error: any) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">

            {/* ⚫ BACKDROP: Click to Close */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* ⚪ MODAL CARD: Stop Propagation */}
            <div
                className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors z-20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {/* Scrollable Content */}
                <div className="p-8 sm:p-10 overflow-y-auto no-scrollbar">

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-[#c5050c] mb-3 tracking-tight">
                            {mode === "LOGIN" ? "Welcome Back" : "Join MadCollab"}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Connect with your <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">@wisc.edu</span> account
                        </p>
                    </div>

                    <button
                        onClick={() => { login("google"); onClose(); }}
                        className="group w-full bg-[#c5050c] hover:bg-red-700 text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-4 font-bold text-lg shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] mb-3"
                    >
                        <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:rotate-12 transition-transform">
                            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
                        </div>
                        <span>Log in with NetID</span>
                    </button>

                    <p className="text-xs text-center text-slate-400 mb-6 leading-relaxed">
                        Authenticates via UW-Madison Google Workspace. <br />You may be redirected to Duo Mobile.
                    </p>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-400">
                            <span className="px-3 bg-white">Developer Access</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "SIGNUP" && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c5050c]/20 focus:border-[#c5050c] outline-none font-semibold text-slate-700 transition-all"
                                    placeholder="Bucky Badger"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Wisc Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c5050c]/20 focus:border-[#c5050c] outline-none font-semibold text-slate-700 transition-all"
                                placeholder="netid@wisc.edu"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c5050c]/20 focus:border-[#c5050c] outline-none font-semibold text-slate-700 transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Processing..." : (mode === "LOGIN" ? "Sign In with Email" : "Create Account")}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setMode(mode === "LOGIN" ? "SIGNUP" : "LOGIN")}
                            className="text-sm font-semibold text-[#c5050c] hover:text-red-700 hover:underline transition-all"
                        >
                            {mode === "LOGIN" ? "Need a guest account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
