/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/UserContext";
import { auth } from "../lib/firebase";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { login, loginWithEmail, signupWithEmail, logout } = useAuth();
    const [mode, setMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 🆕 State for tracking verification polling
    const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);

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
            // Reset state when closed
            setIsAwaitingVerification(false);
            setLoading(false);
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // 🔄 Email Verification Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isAwaitingVerification) {
            interval = setInterval(async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await currentUser.reload(); // 🔥 Crucial: get the freshest data
                    if (currentUser.emailVerified) {
                        clearInterval(interval);
                        setIsAwaitingVerification(false);
                        try {
                            // ✅ Auto-login by simulating the login flow
                            setLoading(true);
                            await loginWithEmail(email, password);
                            onClose(); // Redirects/closes modal naturally due to context update
                        } catch (err: any) {
                            console.error("Auto-login post-verification failed:", err);
                            alert("Verification successful, but login failed. Please try logging in manually.");
                            setMode("LOGIN");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAwaitingVerification, email, password, loginWithEmail, onClose]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "LOGIN") {
                await loginWithEmail(email, password);
                onClose();
            } else {
                await signupWithEmail(email, password, name);
                
                // 📝 Bypass verification screen for whitelist
                const WHITELISTED_EMAILS = ["redfe01@gmail.com"];
                if (WHITELISTED_EMAILS.includes(email.toLowerCase())) {
                    onClose();
                } else {
                    setIsAwaitingVerification(true); // 🚀 Start polling!
                }
            }
        } catch (error: any) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            if (mode === "LOGIN") setLoading(false);
            // If signup, we keep loading true/false depending on the UI we want
            if (mode === "SIGNUP") setLoading(false);
        }
    };

    const handleCancelVerification = async () => {
        setIsAwaitingVerification(false);
        await logout(); // Ensure we sign out the unverified session
        setMode("LOGIN");
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

                    {isAwaitingVerification ? (
                        // 📬 Awaiting Verification UI
                        <div className="text-center py-6 animate-in slide-in-from-right-4">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-[#c5050c] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">
                                Check Your Inbox
                            </h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                We sent a verification link to <br />
                                <span className="font-bold text-slate-800">{email}</span>
                            </p>

                            <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                                <p className="text-sm font-medium text-slate-600 mb-2">
                                    Please verify your email to continue.
                                </p>
                                <p className="text-xs text-slate-400">
                                    Waiting for verification... This window will close automatically.
                                </p>
                            </div>

                            <button
                                onClick={handleCancelVerification}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Cancel & Return to Login
                            </button>
                        </div>
                    ) : (
                        // Standard Login / Signup UI
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-extrabold text-[#c5050c] mb-3 tracking-tight">
                                    {mode === "LOGIN" ? "Welcome Back" : "Join MadCollab"}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm">
                                    Connect with your <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">@wisc.edu</span> account
                                </p>
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
                                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-semibold text-slate-700 transition-all ${email && !email.toLowerCase().endsWith("@wisc.edu") && !["redfe01@gmail.com"].includes(email.toLowerCase())
                                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-[#c5050c]/20 focus:border-[#c5050c]"
                                            }`}
                                        placeholder="netid@wisc.edu"
                                        required
                                        title="Please use your UW-Madison email (@wisc.edu)"
                                    />
                                    {email && !email.toLowerCase().endsWith("@wisc.edu") && !["redfe01@gmail.com"].includes(email.toLowerCase()) && (
                                        <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                            Please use your UW-Madison email
                                        </p>
                                    )}
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
                        </>
                    )}

                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
